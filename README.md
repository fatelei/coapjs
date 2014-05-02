CoAPJS
======

CoAP Protocol Implement In NodeJS


CoAP Status Code
----------------------
1. Success 2.xx
	
	This class of status code indicates that the clients request was
	successfully received, understood, and accepted.
	
	* 2.01
	
	  It stands for created success.
	  
	* 2.02
	
	  It stands for deleted success.
	  
	* 2.03
	
	  Related to HTTP 304 "Not Modified", but only used to indicate that the response identified by the entity-tag identified by the included ETag Option is valid.  Accordingly, the response MUST include an ETag Option, and MUST NOT include a payload.
	  
	* 2.04
	
	  Like HTTP 204 "No Content", but only used in response to POST and PUT requests.  The payload returned with the response, if any, is a representation of the action result. This response is not cacheable.  However, a cache MUST mark any stored response for the changed resource as not fresh.
	  
	* 2.05
	
	  Like HTTP 200 "OK", but only used in response to GET requests.2. Client Error 4.xx
   This class of response code is intended for cases in which the client seems to have erred.  These response codes are applicable to any request method.

   * 4.00
   
     Like HTTP 400 "Bad Request".
     
   * 4.01
   
     The client is not authorized to perform the requested action.  The client SHOULD NOT repeat the request without first improving its authentication status to the server.
     
   * 4.02
     
     The request could not be understood by the server due to one or more unrecognized or malformed options.  The client SHOULD NOT repeat the request without modification.
     
   * 4.03
   
     Like HTTP 403 "Forbidden".
     
   * 4.04
   
     Like HTTP 404 "Not Found".
     
   * 4.05
   
     Like HTTP 405 "Method Not Allowed", but with no parallel to the "Allow" header field.
     
   * 4.06
   
     Like HTTP 406 "Not Acceptable", but with no response entity.
     
   * 4.12
   
     Like HTTP 412 "Precondition Failed".
     
   * 4.13
   
     Like HTTP 413 "Request Entity Too Large".
     
   * 4.15
   
     Like HTTP 415 "Unsupported Media Type".
     
     
3. Server Error 5.xx

   * 5.00
   
     Like HTTP 500 "Internal Server Error".
     
   * 5.01
   
     Like HTTP 501 "Not Implemented".
     
   * 5.02
   
     Like HTTP 502 "Bad Gateway".
     
   * 5.03
   
     Like HTTP 503 "Service Unavailable", but using the Max-Age Option in place of the "Retry-After" header field to indicate the number of seconds after which to retry.
     
   * 5.04
   
     Like HTTP 504 "Gateway Timeout".   * 5.05
     The server is unable or unwilling to act as a forward-proxy for the URI specified in the Proxy-Uri Option or using Proxy-Scheme.




