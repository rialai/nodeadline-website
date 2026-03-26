# Nodeadline landing page

Static GitHub Pages website for nodeadline.ie.

## Files

- index.html
- styles.css
- script.js
- CNAME

## Deploy via GitHub Pages

1. Push this folder as a GitHub repository.
2. Ensure default branch is main.
3. In repository settings:
   - Open Pages.
   - In Build and deployment, choose Source: GitHub Actions.
4. Push any commit to main to trigger deployment.

## Connect custom domain nodeadline.ie

The CNAME file is already configured with nodeadline.ie.

Configure DNS at your domain provider:

- Type: A, Host: @, Value: 185.199.108.153
- Type: A, Host: @, Value: 185.199.109.153
- Type: A, Host: @, Value: 185.199.110.153
- Type: A, Host: @, Value: 185.199.111.153
- Type: AAAA, Host: @, Value: 2606:50c0:8000::153
- Type: AAAA, Host: @, Value: 2606:50c0:8001::153
- Type: AAAA, Host: @, Value: 2606:50c0:8002::153
- Type: AAAA, Host: @, Value: 2606:50c0:8003::153
- Optional: Type: CNAME, Host: www, Value: nodeadline.ie

After DNS propagates, enable Enforce HTTPS in GitHub Pages settings.
