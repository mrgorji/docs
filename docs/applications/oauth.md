# OAuth2 Authentication and Authorization

Integrated apps in Veritone use the [OAuth 2.0](http://oauth.net/2/) protocol to authenticate, provide single sign-on, and generate tokens for use with APIs. It works by delegating user authentication to Veritone and then authorizing your application to obtain specific user account data while keeping usernames, passwords, and other information private. 

### General OAuth Flow

The general authentication flow consists of a three-part process that starts with the user authenticating with their Veritone credentials, then authorizing your app to access the Veritone system, and finally allowing your app to access the user’s data.

![general-flow](VDA-AppQS-Step2-OAuth-General-Flow.png)

1. A "Sign in with Veritone" button on your app’s login page initiates user authentication. When the user clicks the button, it redirects them to Veritone’s OAuth 2 server to log in, which authenticates their identity and authorizes your application to access their account. Once the user logs in, an authorization grant is sent to your app.

2. Your application requests an *Access Token* from Veritone’s authorization server by presenting credentials to verify its identity and the authorization grant. If the application identity is authenticated and the authorization grant is valid, an *Access Token* is issued to the application and authorization is complete.

3. Your application uses the *Access Token* to request user account resources from the Veritone API (resource server). If the *Access Token* is valid, the resource server returns the requested resource to the application.

Depending on the specific flow type that you use, the actual process will differ slightly from the general flow shown above. Veritone supports two flows for authentication:

* The **Authorization Code Flow** is designed for server-side apps that are capable of securely storing the client secret.

* The **Implicit Flow** is designed for apps that have no back-end logic on the web server (e.g., a Javascript app).

Detailed information about the different flows is provided later in this document to help you decide which one is best suited for your application. If you already know which flow you want to use, you can jump directly to the Authorization Code Flow or Implicit Flow section. 

## Getting Started 

Before using OAuth with your application, you must register your application with the Veritone. All registered Veritone-integrated applications are issued a set of authorization credentials that identify the app to Veritone’s OAuth 2.0 server. Once your application is registered, Veritone will issue a *Client ID* and a *Client Secret*. 

* **Application Client ID:** A publicly exposed string that is used by the Veritone API to identify your application. The Client ID is also built into the Authorization URL that authenticates users .

* **Client Secret:** A unique value used to authenticate the identity of your application to the Veritone API when your application requests to access a user's account. The Client Secret must be kept private.

* **Redirect URI:** The URI where the user will be directed after they authorize your application to access your account. The Redirect URI must point to the part of your application that will handle authorization codes or access tokens.

#### Access the Client ID, Client Secret & Redirect URI

The *Client ID*, *Client Secret*, and *Redirect URI* are available at the top of the *Application *settings page.

1. Log into Veritone Developer. Click *Overview* in the upper left of the window and select *Applications* from the dropdown. The *Applications* dashboard opens. 

2. Click the appropriate **application name** in the list. The *Application Settings* open.
![client-secret1](VDA-Oauth-Client-Secret-1.png)

3. The *Client ID*, *Client Secret*, and *Redirect URI* display at the top of the page. To retrieve the *Client Secret*, click **Click to reveal**, enter your Veritone password, and click **Submit** (do not press enter on your keyboard).The *Client Secret* displays.
![client-secret2](VDA-Oauth-Client-Secret-1.png)

### Examples and Libraries

The [passport-veritone](https://github.com/veritone/veritone-sdk/tree/master/packages/passport-veritone) library provides a strategy for [Passport JS](http://www.passportjs.org/) which can be used in NodeJS apps to handle the OAuth2 token exchange.

[veritone-widgets-server](https://github.com/veritone/veritone-sdk/tree/master/packages/veritone-widgets-server) implements the full token exchange using passport-veritone.

[veritone-oauth-helpers](https://github.com/veritone/veritone-sdk/tree/master/packages/veritone-oauth-helpers) implements the client-side portion of the OAuth2 flow, with simple login() and logout() functions.

## Implementing the Authorization Code Flow

The authorization code flow is designed for server-side applications where source code is not publicly exposed and the confidentiality of the *Client Secret* can be maintained. This is a redirection-based flow that begins with user authentication returning an *Authorization Code* that’s exchanged for an *Access Token* to access the user’s account. Along with the *Access Token*, you get a *Refresh Token* that can be saved in your database and used at a later point to generate a new Access Token when the original expires. Because the Authorization Code Flow uses a Client ID and Client Secret to retrieve the tokens from the back end, it has the benefit of not exposing tokens to the web browser. 

At a high-level, the Authorization Code Flow follows these steps when a user attempts to initiate a session with your application by clicking a "Sign In with Veritone" button.</br> 
![sign-in-button](VDA-AppQS-Step2-OAuth-Sign-in-with-Veritone-Button.png)

1. Your application redirects the user to the Veritone authorization server, where the user authenticates their identity and authorizes your app to access their account by logging in.
2. An Authorization Code is passed to your application from the Veritone authorization server.
3. Your application sends the Authorization Code to Veritone, and Veritone returns an Access Token and a Refresh Token.
4. Your application can use the Access Token to call the Veritone API and access the user’s account.

![authorization-code-flow](VDA-AppQS-Step2-OAuth-Authorization-Code-Flow.png)

### **Step 1: Authenticate User and Get Authorization Code**

A "Sign In With Veritone" button initiates user authentication. When a user clicks the button, you'll send them to an authorization page where they will authenticate their identity and grant access to your application. In this first step, you'll construct a link to the authorization page by adding specific parameters to the query that identify your app. The *Client ID* and *Redirect URI *that you'll need to include in the authorization URL can be found in the settings for your app, which you can get to by clicking the name of your app from the *Applications* dashboard.

##### Authorization URL Components

<table>
  <tr>
    <td>Parameter</td>
    <td>Type</td>
    <td>Description</td>
  </tr>
  <tr>
    <td>response_type</td>
    <td>string</td>
    <td>The type of response being requested. Set the value as "code" to indicate that your application is requesting an authorization code in the response. </td>
  </tr>
  <tr>
    <td>client_id</td>
    <td>string</td>
    <td>The unique ID of your application. You can get the ID from the Application Settings page.</td>
  </tr>
  <tr>
    <td>redirect_uri</td>
    <td>string</td>
    <td>The URL that you want the user redirected to after granting access to your app. This must match the Redirect URI value in the Application Settings. </td>
  </tr>
  <tr>
    <td>scope</td>
    <td>string</td>
    <td>The level of access that your application is requesting. Currently the only permissible value for the scope parameter is "all."</td>
  </tr>
</table>


##### Sample Authorization URL

```http
https://api.veritone.com/v1/admin/oauth/authorize?response_type=code&client_id=e6ac4220-5898-456b-b6ae-ff4f4bb6b9bf&redirect_uri=https://bestappever.com/oauth/callback&scope=all
```

#### User Authorizes Application

When the user clicks the link, they’re prompted to log into Veritone to authenticate their identity and authorize your application to access their account. 

#### Application Receives Authorization Code

After the user grants access by logging in, they arrive at your application’s Redirect URI with an *Authorization Code* query parameter appended to the URL. You'll use that code in the next step to get an *Access Token* and a *Refresh Token* from Veritone. 

##### Sample Redirect URI with Authorization Code 

```http
https://bestappever.com/oauth/callback?code=U1XbJMBhiRk
```


#### Possible Errors

<table>
  <tr>
    <td>Error ID</td>
    <td>Details</td>
  </tr>
  <tr>
    <td>invalid_request</td>
    <td>The request is missing a necessary parameter or the parameter has an invalid value.</td>
  </tr>
  <tr>
    <td>unauthorized_client</td>
    <td>The Client ID is invalid or the client is not authorized to request an authorization code using this method.</td>
  </tr>
  <tr>
    <td>access_denied</td>
    <td>The server denied the request.</td>
  </tr>
  <tr>
    <td>unsupported_response_type</td>
    <td>The specified response type is invalid or unsupported.</td>
  </tr>
  <tr>
    <td> invalid_scope</td>
    <td>The requested scope is invalid, unknown, or malformed.</td>
  </tr>
  <tr>
    <td>server_error</td>
    <td>The server encountered an internal error.</td>
  </tr>
  <tr>
    <td>temporarily_unavailable</td>
    <td>The server is temporarily unavailable but should be able to process the request at a later time</td>
  </tr>
</table>



### **Step 2: Request Access and Refresh Tokens**

Your application uses the *Authorization Code* it received to request an *Access Token* and a *Refresh Token* from the Veritone server. To exchange the code for tokens, make a call to the *Token Exchange* endpoint with the parameters below posted as a part of the URL-encoded form values.

*Important note:* To ensure the security of the *Client Secret*, this request must happen from your application server and not the front end of your app.

##### Request Details
* **HTTP Method:** POST
* **Content Type:** application/x-www-form-urlencoded
* **Response Format:** JSON
* **Endpoint:** https://api.veritone.com/v1/admin/oauth/token

##### Request Parameters

<table>
  <tr>
    <td>Parameter</td>
    <td>Type</td>
    <td>Description</td>
  </tr>
  <tr>
    <td>client_id</td>
    <td>string</td>
    <td>The unique ID of your application. You can get the ID from the Application Settings page.</td>
  </tr>
  <tr>
    <td>client_secret</td>
    <td>string</td>
    <td>Your application’s Client Secret. You can get the Client Secret from the Application Settings page.</td>
  </tr>
  <tr>
    <td>grant_type</td>
    <td>string</td>
    <td>The grant type of the request. The value must be authorization_code to indicate that your application is exchanging an Authorization Code for a Access and Refresh Tokens.</td>
  </tr>
  <tr>
    <td>code</td>
    <td>string</td>
    <td>The Authorization Code value returned to your redirect URI when the user authorized your app. </td>
  </tr>
  <tr>
    <td>redirect_uri</td>
    <td>string</td>
    <td>The redirect URI that was used when the user authorized your app (Step 1). This must match the Redirect URI value in the Application Settings.</td>
  </tr>
</table>


##### Sample Request

```http
curl -X POST \ 
https://api.veritone.com/v1/admin/oauth/token \ 
-H 'content-type: application/x-www-form-urlencoded' \ 
-d 'client_id=e6ac4220-5898-456b-b6ae-ff4f4bb6b9bf&client_secret=3GJjP97ryVwKvqXt6L518Hf5wUEZ1Po2lsobEEoAZh1D-WxB35cn-A&code=U1XbJMBhiRk&grant_type=authorization_code&redirect_uri=https://bestappever.com/oauth/callback'
```

#### Application Receives Access Token

A successful response from the code exchange request contains the *Access* and *Refresh Tokens*. 

##### Sample Response

```http
{
   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTEwZjIxYS1mYzY5LTQ4NTctODkwZS1iMDNmZGU1ZGJlYjMiLCJjb250ZW50QXBwbGljYXRpb25JZCI6ImVkMDc1OTg1LWJjOTQtNDA2Yi04NjM5LTQ0ZDFkYTQyYzNmYiIsIm9yaWdpbkhvc3QiOiJjYXBhcHAuY29tIiwic2NvcGUiOlt7ImFjdGlvbnMiOlsiaW5nZXN0aW9uOmRlbGV0ZSIsImluZ2VzdGlvbjp1cGRhdGUiLCJpbmdlc3Rpb246cmVhZCIsImluZ2VzdGlvbjpjcmVhdGUiLCJqb2I6Y3JlYXRlIiwiam9iOnJlYWQiLCJqb2I6dXBkYXRlIiwiam9iOmRlbGV0ZSIsInRhc2s6dXBkYXRlIiwicmVjb3JkaW5nOmNyZWF0ZSIsInJlY29yZGluZzpyZWFkIiwicmVjb3JkaW5nOnVwZGF0ZSIsInJlY29yZGluZzpkZWxldGUiLCJyZWNvcmRpbmc6Y2xvbmUiLCJyZXBvcnQ6Y3JlYXRlIiwiYW5hbHl0aWNzOnVzYWdlIiwibWVudGlvbjpjcmVhdGUiLCJtZW50aW9uOnJlYWQiLCJtZW50aW9uOnVwZGF0ZSIsIm1lbnRpb246ZGVsZXRlIiwiY29sbGVjdGlvbjpjcmVhdGUiLCJjb2xsZWN0aW9uOnJlYWQiLCJjb2xsZWN0aW9uOnVwZGF0ZSIsImNvbGxlY3Rpb246ZGVsZXRlIiwiYXNzZXQ6dXJpIl19XSwiaWF0IjoxNTIxNTUzMDA3LCJleHAiOjE1MjIxNTc4MDcsInN1YiI6Im9hdXRoMiIsImp0aSI6ImU5M2I1ODI4LTI2ZWEtNDRjZC1iY2RjLTJhODI0NzdjYWUwNCJ9.c8YmVN_R4OhVYFRscBi1wIXIX7MzhPwixHe-UQ05gE0",
   "refresh_token": "xi_kwP2_laa4t7_Mwu-k0a_dka3V3YWfIH-Nm7C84XaBvkjyUDdS5A",
   "token_type": "Bearer"
}
```

Your application is now authorized! The *Access Token* is used to authenticate API requests that your app makes to access the user's account. 

#### Possible Errors

<table>
  <tr>
    <td>Error ID</td>
    <td>Details</td>
  </tr>
  <tr>
    <td>invalid_client</td>
    <td>Application authentication failed.</td>
  </tr>
  <tr>
    <td>invalid_grant</td>
    <td>The code is invalid or the redirect_uri does not match the one used in the authorization request.</td>
  </tr>
  <tr>
    <td>invalid_request</td>
    <td>A required parameter is missing or invalid.</td>
  </tr>
  <tr>
    <td>unauthorized_client</td>
    <td>The application is not authorized to use the grant.</td>
  </tr>
  <tr>
    <td>unsupported_grant_type</td>
    <td>The grant_type isn’t authorization_code.</td>
  </tr>
</table>


### **Step 3. Using OAuth 2.0 Access Tokens**

Your application will use the Access Token to access the user's account via the Veritone API. An Access Token is passed as a bearer token in the Authorization http header of requests. 

##### Sample header format

```http
Authorization: Bearer {access token}
```

Access tokens expire after seven days and the refresh token may be used to request new a new access token if the initial token expires. If the access token is expired or otherwise invalid, the API will return an error.

### **Step 4. Using a Refresh Token**

*Access Tokens* expire every seven days. When an *Access Toke*n expires, using it to make an API request will result in an "Invalid Token Error." You can use the *Refresh Token* that was included when the original *Access Token* was issued to get a new *Access Token* without requiring the user to be redirected. 

##### Request Details

* **HTTP Method:** POST
* **Content Type:** application/x-www-form-urlencoded
* **Response Format:** JSON
* **Endpoint**: https://api.veritone.com/v1/admin/oauth/token

##### Request Parameters

<table>
  <tr>
    <td>Parameter</td>
    <td>Type</td>
    <td>Description</td>
  </tr>
  <tr>
    <td>client_id</td>
    <td>string</td>
    <td>The unique ID of your application. You can get the ID from the Application Settings page.</td>
  </tr>
  <tr>
    <td>client_secret</td>
    <td>string</td>
    <td>Your application’s Client Secret. You can get the Client Secret from the Application Settings page.</td>
  </tr>
  <tr>
    <td>grant_type</td>
    <td>string</td>
    <td>The grant type of the request. The value must be refresh_token to indicate that your application is exchanging an Authorization Code for a Access and Refresh Tokens.</td>
  </tr>
  <tr>
    <td>refresh_token</td>
    <td>string</td>
    <td>The Refresh Token value obtained when the original Access Token was issued. </td>
  </tr>
</table>


##### Sample Request

```http
curl -X POST \ 
https://api.veritone.com/v1/admin/oauth/token \ 
-H 'content-type: application/x-www-form-urlencoded' \ 
-d 'client_id=e6ac4220-5898-456b-b6ae-ff4f4bb6b9bf&client_secret=3GJjP97ryVwKvqXt6L518Hf5wUEZ1Po2lsobEEoAZh1D-WxB35cn-A&grant_type=authorization_code&refresh_token=xi_kwP2_laa4t7_Mwu-k0a_dka3V3YWfIH-Nm7C84XaBvkjyUDdS5A'
```

##### Sample Response

```http
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTEwZjIxYS1mYzY5LTQ4NTctODkwZS1iMDNmZGU1ZGJlYjMiLCJjb250ZW50QXBwbGljYXRpb25JZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIm9yaWdpbkhvc3QiOiJjYXBhcHAuY29tIiwic2NvcGUiOlt7ImFjdGlvbnMiOlsiaW5nZXN0aW9uOmRlbGV0ZSIsImluZ2VzdGlvbjp1cGRhdGUiLCJpbmdlc3Rpb246cmVhZCIsImluZ2VzdGlvbjpjcmVhdGUiLCJqb2I6Y3JlYXRlIiwiam9iOnJlYWQiLCJqb2I6dXBkYXRlIiwiam9iOmRlbGV0ZSIsInRhc2s6dXBkYXRlIiwicmVjb3JkaW5nOmNyZWF0ZSIsInJlY29yZGluZzpyZWFkIiwicmVjb3JkaW5nOnVwZGF0ZSIsInJlY29yZGluZzpkZWxldGUiLCJyZWNvcmRpbmc6Y2xvbmUiLCJyZXBvcnQ6Y3JlYXRlIiwiYW5hbHl0aWNzOnVzYWdlIiwibWVudGlvbjpjcmVhdGUiLCJtZW50aW9uOnJlYWQiLCJtZW50aW9uOnVwZGF0ZSIsIm1lbnRpb246ZGVsZXRlIiwiY29sbGVjdGlvbjpjcmVhdGUiLCJjb2xsZWN0aW9uOnJlYWQiLCJjb2xsZWN0aW9uOnVwZGF0ZSIsImNvbGxlY3Rpb246ZGVsZXRlIiwiYXNzZXQ6dXJpIl19XSwiaWF0IjoxNTIxNzQwNTQyLCJleHAiOjE1MjIzNDUzNDIsInN1YiI6Im9hdXRoMiIsImp0aSI6IjE2ZTg5ZWE1LTUwMTUtNGQzOS05OTJlLTIyZGQ0ZWVhNTdhYiJ9.9zMKZsbKIiAkmxhYsV4QJ1RiSKm4H1jp51w5iRqTQ-8",
  "refresh_token": "xi_kwP2_laa4t7_Mwu-k0a_dka3V3YWfIH-Nm7C84XaBvkjyUDdS5A",
  "token_type": "Bearer"
}
```

## Implementing the Implicit Flow

The Implicit Flow is used for browser-based web applications (without a back-end server) where the confidentiality of the *Client Secret* cannot be maintained. This is a redirection-based flow with all communication happening on the front end. The token to access a user’s account is given to the browser to forward to the application. 

At a high-level, the Implicit Flow follows these steps when a user attempts to initiate a session with your application by clicking a "Sign In with Veritone" button.</br>
![sign-in-button](VDA-AppQS-Step2-OAuth-Sign-in-with-Veritone-Button.png)

1. Your application redirects the user to the Veritone authorization page, where the user authenticates by logging in.
2. Upon user login, Veritone redirects the user back to your application’s redirect URI with an Access Token as a URL fragment after the hash.
3. Your application extracts the Access Token from the URL and uses it to call the Veritone API and access the user’s account.

![implicit-flow](VDA-AppQS-Step2-OAuth-Implicit-Flow.png)

*Additional notes:*
* The Client Secret is not used with the Implicit Flow since it is not able to be kept confidential.
* The Implicit Flow does not support Refresh Tokens. As a result, your app must request a new token each time the user logs in (if the token is not stored) or when the Access Token expires.

### **Step 1: Authenticate User and Get Access Token**

When a user attempts to begin a session with your app, they’ll click a "Sign In With Veritone" button on your login page and initiate the authentication process. In this first step, you'll construct an link that sends the user to Veritone’s authorization page and requests an *Access Token* from the API. 

Use the components shown below to build the authorization URL. The *Client ID* and *Redirect URI* that you'll need to include can be found in the settings for your app, which you can get to by clicking the name of your app from the Applications dashboard.

##### Authorization Link Components

<table>
  <tr>
    <td>Parameter</td>
    <td>Type</td>
    <td>Description</td>
  </tr>
  <tr>
    <td>response_type</td>
    <td>string</td>
    <td>The type of response being requested. Set the value as "token" to indicate that your application is requesting an Access Token in the response. </td>
  </tr>
  <tr>
    <td>client_id</td>
    <td>string</td>
    <td>The unique ID of your application. You can get the ID from the Application settings page.</td>
  </tr>
  <tr>
    <td>redirect_uri</td>
    <td>string</td>
    <td>The URL that you want the user redirected to after granting access to your app. This must match the Redirect URI value in the Application settings. </td>
  </tr>
  <tr>
    <td>scope</td>
    <td>string</td>
    <td>The level of access that your application is requesting. Currently the only permissible value for the scope parameter is "all."</td>
  </tr>
</table>


##### Sample Authorization URL

```http
https://api.veritone.com/v1/admin/oauth/authorize?response_type=token&client_id=e6ac4220-5898-456b-b6ae-ff4f4bb6b9bf&redirect_uri=https://bestappever.com/oauth/callback&scope=all
```

#### User Authorizes Application

When the user follows the authorization URL, they’re prompted to log in to Veritone to authenticate their identity and authorize your application to access their account. 

#### Application Receives Access Token

After the user grants access by logging in, they are sent to your application Redirect URI with an *Access Token* appended to the URL.

##### Sample Redirect URI with Access Token 

```http
https://bestappever.com/oauth/callback#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTEwZjIxYS1mYzY5LTQ4NTctODkwZS1iMDNmZGU1ZGJlYjMiLCJjb250ZW50QXBwbGljYXRpb25JZCI6ImVkMDc1OTg1LWJjOTQtNDA2Yi04NjM5LTQ0ZDFkYTQyYzNmYiIsIm9yaWdpbkhvc3QiOiJjYXBhcHAuY29tIiwic2NvcGUiOlt7ImFjdGlvbnMiOlsiaW5nZXN0aW9uOmRlbGV0ZSIsImluZ2VzdGlvbjp1cGRhdGUiLCJpbmdlc3Rpb246cmVhZCIsImluZ2VzdGlvbjpjcmVhdGUiLCJqb2I6Y3JlYXRlIiwiam9iOnJlYWQiLCJqb2I6dXBkYXRlIiwiam9iOmRlbGV0ZSIsInRhc2s6dXBkYXRlIiwicmVjb3JkaW5nOmNyZWF0ZSIsInJlY29yZGluZzpyZWFkIiwicmVjb3JkaW5nOnVwZGF0ZSIsInJlY29yZGluZzpkZWxldGUiLCJyZWNvcmRpbmc6Y2xvbmUiLCJyZXBvcnQ6Y3JlYXRlIiwiYW5hbHl0aWNzOnVzYWdlIiwibWVudGlvbjpjcmVhdGUiLCJtZW50aW9uOnJlYWQiLCJtZW50aW9uOnVwZGF0ZSIsIm1lbnRpb246ZGVsZXRlIiwiY29sbGVjdGlvbjpjcmVhdGUiLCJjb2xsZWN0aW9uOnJlYWQiLCJjb2xsZWN0aW9uOnVwZGF0ZSIsImNvbGxlY3Rpb246ZGVsZXRlIiwiYXNzZXQ6dXJpIl19XSwiaWF0IjoxNTIxNTUzMTY1LCJleHAiOjE1MjIxNTc5NjUsInN1YiI6Im9hdXRoMiIsImp0aSI6IjQ1OTk3NTBmLWY0ZjYtNGQ4OC05MDAwLTU5M2U1NzI5MmQ5NSJ9.1IduQXLnATUqnJnDKLJ2-uM2iimaT6qEkGetl6qm2Bk&token_type=Bearer
```

#### Possible Errors

If authorization fails, an error response will be sent to your application redirect URI in the format shown below.

```http
http://yourapp.com#error={error_ID}
```

Any errors are appended to the URI using one of the following Error IDs.

<table>
  <tr>
    <td>Error ID</td>
    <td>Details</td>
  </tr>
  <tr>
    <td>invalid_request</td>
    <td>The request is missing a necessary parameter or the parameter has an invalid value.</td>
  </tr>
  <tr>
    <td>unauthorized_client</td>
    <td>The Client ID is invalid or the client is not authorized to request an authorization code using this method.</td>
  </tr>
  <tr>
    <td>access_denied</td>
    <td>The server denied the request.</td>
  </tr>
  <tr>
    <td>unsupported_response_type</td>
    <td>The specified response type is invalid or unsupported.</td>
  </tr>
  <tr>
    <td> invalid_scope</td>
    <td>The requested scope is invalid, unknown, or malformed.</td>
  </tr>
  <tr>
    <td>server_error</td>
    <td>The server encountered an internal error.</td>
  </tr>
  <tr>
    <td>temporarily_unavailable</td>
    <td>The server is temporarily unavailable but should be able to process the request at a later time</td>
  </tr>
</table>


### **Step 2: Use the Access Token **

Once your application has an *Access Token*, you can use it to access the user's account via the Veritone API. To make requests, pass the *Access Token* in the *Authorization* header with the value *Bearer {access token}*.

##### Sample header format

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTEwZjIxYS1mYzY5LTQ4NTctODkwZS1iMDNmZGU1ZGJlYjMiLCJjb250ZW50QXBwbGljYXRpb25JZCI6ImVkMDc1OTg1LWJjOTQtNDA2Yi04NjM5LTQ0ZDFkYTQyYzNmYiIsIm9yaWdpbkhvc3QiOiJjYXBhcHAuY29tIiwic2NvcGUiOlt7ImFjdGlvbnMiOlsiaW5nZXN0aW9uOmRlbGV0ZSIsImluZ2VzdGlvbjp1cGRhdGUiLCJpbmdlc3Rpb246cmVhZCIsImluZ2VzdGlvbjpjcmVhdGUiLCJqb2I6Y3JlYXRlIiwiam9iOnJlYWQiLCJqb2I6dXBkYXRlIiwiam9iOmRlbGV0ZSIsInRhc2s6dXBkYXRlIiwicmVjb3JkaW5nOmNyZWF0ZSIsInJlY29yZGluZzpyZWFkIiwicmVjb3JkaW5nOnVwZGF0ZSIsInJlY29yZGluZzpkZWxldGUiLCJyZWNvcmRpbmc6Y2xvbmUiLCJyZXBvcnQ6Y3JlYXRlIiwiYW5hbHl0aWNzOnVzYWdlIiwibWVudGlvbjpjcmVhdGUiLCJtZW50aW9uOnJlYWQiLCJtZW50aW9uOnVwZGF0ZSIsIm1lbnRpb246ZGVsZXRlIiwiY29sbGVjdGlvbjpjcmVhdGUiLCJjb2xsZWN0aW9uOnJlYWQiLCJjb2xsZWN0aW9uOnVwZGF0ZSIsImNvbGxlY3Rpb246ZGVsZXRlIiwiYXNzZXQ6dXJpIl19XSwiaWF0IjoxNTIxNTUzMTY1LCJleHAiOjE1MjIxNTc5NjUsInN1YiI6Im9hdXRoMiIsImp0aSI6IjQ1OTk3NTBmLWY0ZjYtNGQ4OC05MDAwLTU5M2U1NzI5MmQ5NSJ9.1IduQXLnATUqnJnDKLJ2-uM2iimaT6qEkGetl6qm2Bk
```

Access tokens expire after seven days. Unlike the Authorization Code Flow, *Refresh Tokens* are not issued with the Implicit Flow. Refreshing a token requires use of the Client Secret, which cannot safely be stored with the Implicit Flow. If your application does not store the *Access Token*, users will be required to log in and re-authorize your app with each session. If your application stores the token and sends the user to the authorization page before the *Access Token* expires, the user will not be prompted to log in and will be immediately redirected to your application. API calls made with an expired or invalid token will result in an error.
