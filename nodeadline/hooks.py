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
# The landing page is a standalone "coming soon" placeholder that controls its
# own <head>; no custom favicon/logo is shipped, so there is nothing to set here.

# The placeholder page is fully self-contained (inline CSS, no JS), so we
# deliberately do NOT use web_include_css / web_include_js.

# Installation
# ------------
# after_install = "nodeadline.install.after_install"
