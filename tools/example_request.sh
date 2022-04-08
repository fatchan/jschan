#!/bin/bash
#
# Send an authenticated request to jschan
#

# Variables, change me
DOMAIN="your.ib"
USERNAME="username"
PASSWORD="password"
FORM_PATH="/forms/whatever"
FORM_DATA="something=ABC&something_else=123"

# Login
LOGIN_REQUEST=$(curl -si "https://$DOMAIN/forms/login" \
	-H "Referer: https://$DOMAIN" \
	-H "x-using-xhr: 1" \
	--data "username=$USERNAME" \
	--data "password=$PASSWORD")
RESPONSE_CODE=$(echo "$LOGIN_REQUEST" | grep HTTP |  awk '{print $2}')
[[ "$RESPONSE_CODE" != "302" ]] && echo "Login failed" && exit;
SESSION_COOKIE=$(echo "$LOGIN_REQUEST" | grep 'set-cookie' | awk '{print $2}')

# Get CSRF token
CSRF_REQUEST=$(curl -s "https://$DOMAIN/csrf.json" \
	-H "Cookie: $SESSION_COOKIE" \
	-H "Referer: https://$DOMAIN" \
	-H "x-using-xhr: 1")
CSRF_TOKEN=$(echo "$CSRF_REQUEST" | jq -j '.token')

# Send authed request
ANNOUNCEMENT_REQUEST=$(curl -si "https://$DOMAIN$FORM_PATH" \
	-H "Cookie: $SESSION_COOKIE" \
	-H "Referer: https://$DOMAIN" \
	-H "x-using-xhr: 1" \
	--data "_csrf=$CSRF_TOKEN" \
	--data "$FORM_DATA")
