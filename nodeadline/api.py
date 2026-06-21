# Guest lead-capture endpoint for the Nodeadline landing page.
#
# Targets ERPNext's core "Lead" doctype (ERPNext is expected on the same site).
# Endpoint:  POST /api/method/nodeadline.api.create_lead
#
# The whole thing degrades gracefully: if ERPNext / "Lead" is not installed we
# return a clear message instead of a 500, so the marketing site never hard-fails
# on a misconfigured bench.

import json

import frappe
from frappe import _
from frappe.rate_limiter import rate_limit
from frappe.utils import escape_html, strip_html_tags, validate_email_address

# Fixed Lead Source for inbound website leads. ERPNext ships a "Website" source;
# we still guard the assignment so a missing record never blocks lead creation.
WEBSITE_LEAD_SOURCE = "Website"

# Map the CTA the visitor clicked to a readable label stored on the lead note.
CTA_LABELS = {
	"request-access": "Request access",
	"book-call": "Book a 20-min call",
	"quiz": "Finished the business-map quiz",
	"contact": "Contact form",
}


# Decorator notes (both confirmed against Frappe v16 by live testing):
#  - `frappe.rate_limit` is NOT a top-level attribute — import rate_limit from
#    frappe.rate_limiter.
#  - @frappe.whitelist must be the OUTERMOST decorator. rate_limit returns a
#    wrapper; if whitelist sits below it, the registered/whitelisted callable is
#    the inner one and guests hit "not whitelisted" (403). whitelist on top
#    registers the rate-limited wrapper, and rate limiting still applies.
@frappe.whitelist(allow_guest=True)
@rate_limit(key="email", limit=6, seconds=60 * 60, ip_based=True)
def create_lead(
	name=None,
	email=None,
	company=None,
	phone=None,
	message=None,
	quiz=None,
	cta=None,
	# Honeypot: a hidden field that real users never fill in. Bots usually do.
	website=None,
):
	"""Create an ERPNext Lead from the public landing page.

	Called by Guests via POST. Rate limited to 6 calls/hour per (IP + email).
	Returns a minimal payload — never leaks the internal Lead id.
	"""
	# 1) Honeypot: pretend success so bots don't learn they were filtered.
	if website:
		return {"success": True}

	# 2) Email is the one thing we require, and it must be valid.
	email = (email or "").strip()
	if not email:
		frappe.throw(_("Please enter your email."), frappe.MandatoryError)
	email = validate_email_address(email, throw=True)

	# 3) Sanitise every free-text field — never trust guest input.
	name = strip_html_tags((name or "").strip())[:140]
	company = strip_html_tags((company or "").strip())[:140]
	phone = strip_html_tags((phone or "").strip())[:30]
	message = strip_html_tags((message or "").strip())[:2000]
	cta = strip_html_tags((cta or "").strip())[:60]

	# 4) ERPNext must be present for the "Lead" doctype to exist.
	if not frappe.db.exists("DocType", "Lead"):
		frappe.log_error(
			message="create_lead called but ERPNext 'Lead' doctype is missing",
			title="nodeadline lead capture",
		)
		# Surface a soft error so the front-end can fall back to email.
		return {"success": False, "reason": "lead_doctype_missing"}

	# 5) Lead needs `status` plus at least one of {first_name, company_name}.
	#    Always satisfy both, deriving a sensible name from the email if needed.
	lead_name = name or company or email.split("@")[0]
	doc = frappe.get_doc(
		{
			"doctype": "Lead",
			"lead_name": lead_name,
			"first_name": name or None,
			"company_name": company or (None if name else lead_name),
			"email_id": email,
			"mobile_no": phone or None,
			"status": "Lead",
		}
	)

	# `source` is a Link to "Lead Source" — only set it if the record exists,
	# otherwise the insert would fail on a broken link.
	if frappe.db.exists("Lead Source", WEBSITE_LEAD_SOURCE):
		doc.source = WEBSITE_LEAD_SOURCE

	# Guest has no create permission on Lead, so ignore_permissions is required.
	# Wrap in try/except so an unexpected validation/DB error returns a soft
	# failure (front-end falls back to email) instead of a raw 500.
	try:
		doc.insert(ignore_permissions=True)
	except Exception:
		frappe.db.rollback()
		frappe.log_error(message=frappe.get_traceback(), title="nodeadline create_lead")
		return {"success": False, "reason": "lead_creation_failed"}

	# Attach context (CTA, message, quiz answers) as a CRM Note. This is
	# non-critical: never let a note failure undo a successful lead.
	_attach_note(doc, cta=cta, message=message, quiz=quiz)

	# POST requests auto-commit on success (frappe/app.py sync_database), so no
	# manual frappe.db.commit() is needed here.
	return {"success": True}


def _attach_note(doc, cta=None, message=None, quiz=None):
	"""Append a human-readable CRM Note with the lead's context. Best-effort."""
	parts = []

	if cta:
		parts.append(f"<b>Came via:</b> {escape_html(CTA_LABELS.get(cta, cta))}")
	if message:
		parts.append(f"<b>Message:</b> {escape_html(message)}")

	# The quiz payload is {answers: {...}, map: {...}} — store a readable dump.
	if quiz:
		try:
			quiz_data = json.loads(quiz) if isinstance(quiz, str) else quiz
			pretty = json.dumps(quiz_data, ensure_ascii=False, indent=2)[:60000]
			parts.append("<b>Business-map quiz:</b><pre>" + escape_html(pretty) + "</pre>")
		except (ValueError, TypeError):
			pass

	if not parts:
		return

	try:
		doc.append("notes", {"note": "<br>".join(parts)})
		doc.save(ignore_permissions=True)
	except Exception:
		# CRM Note shape can vary; the lead itself is already saved, so swallow.
		frappe.log_error(title="nodeadline lead note")
