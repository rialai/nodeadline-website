import frappe
from frappe.utils import now_datetime


def get_context(context):
	"""Server-side context for the standalone landing page.

	The page is a complete HTML document, so Frappe renders it as-is (no base
	template / navbar / footer). We only need to pass a couple of values into
	the Jinja template.
	"""
	context.year = now_datetime().year

	# Expose the current session's CSRF token so the lead form can POST safely
	# from a Guest visitor. Rendered into a <meta> tag and read by site.js.
	context.csrf_token = (frappe.session and frappe.session.get("csrf_token")) or ""

	# Render per request so the CSRF token is always fresh and valid for the
	# visitor's session (rather than baking one guest's token into a cached page).
	context.no_cache = 1

	return context
