app_name = "nodeadline"
app_title = "Nodeadline"
app_publisher = "Nodeadline"
app_description = "Nodeadline marketing website — runs on ERPNext / Frappe"
app_email = "nikolai@riabets.com"
app_license = "mit"

# This app is standalone; it does not depend on other Frappe apps.
# (It targets ERPNext's "Lead" doctype at runtime, but only if ERPNext is
# installed on the same site — see nodeadline/api.py, which degrades gracefully.)
required_apps = []

# Home page
# ---------
# The landing page lives at nodeadline/www/index.html and already serves at "/".
# Setting the hook explicitly makes this app win the home-page race over other
# installed apps (e.g. ERPNext) for Guest visitors.
home_page = "index"

# Website context
# ---------------
# Applies to Frappe-rendered pages (login, error pages, etc.). The landing page
# is a standalone HTML document and controls its own <head>, so this does not
# affect it — it only gives the rest of the site a consistent favicon.
website_context = {
	"favicon": "/assets/nodeadline/images/favicon.svg",
}

# The landing page is fully self-contained (its own header/footer/CSS/JS), so we
# deliberately do NOT use web_include_css / web_include_js — those would inject
# assets into every portal page. Each www page links its own assets instead.

# Installation
# ------------
# after_install = "nodeadline.install.after_install"
