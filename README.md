## Lambda Server-Timing Middleware

Enables Lambdas to return responses with Server-Timing Header allowing to to pass request-specific timings from the backend to the browser.

Allows a server to communicate performance metrics about the request-response cycle to the user agent. It also standardizes a JavaScript interface to enable applications to collect, process, and act on these metrics to optimize application delivery.

# Install

```
$ npm install lambda-server-timing
```

# Usage
```
$ withServerTimings()
```

This will attach a Server-Timing header to your response headers with the timings recorded for requests.

The header looks like:
```
HTTP/1.1 200 OK

Server-Timing: db;dur=53, app;dur=47.2
```

And once succesfully returned as a response header, it is shown in the Timings tab under Networks in the Chrome Devtools.
The visual example of it looks like:

![Visual Server-Timing header](https://github.com/NishuGoel/svelte-i18next/assets/26349046/5009ec62-7fe8-429d-8a5b-f338ad28225e)

This now enables developers to look throught the performance problems of their apps for not just the frontend and but also the backend. 

The package also exposes the timer methods `startTime` and `endTime` so you can measure your methods on a regular basis and improve accordingly.


# Usage - startTime/endTime
```
$ startTime('abbr', "getAbbreviatedResponse");
$ getAbbreviatedResponse({
        ...
   });
$ endTime('abbr', "getAbbreviatedResponse");
```