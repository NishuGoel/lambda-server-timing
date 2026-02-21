## Lambda Server-Timing Middleware

Enables Lambdas to return responses with Server-Timing Header allowing to to pass request-specific timings from the backend to the browser.

Allows a server to communicate performance metrics about the request-response cycle to the user agent. It also standardizes a JavaScript interface to enable applications to collect, process, and act on these metrics to optimize application delivery.

![banner](https://github.com/NishuGoel/lambda-server-timing/assets/26349046/0afba8b2-88fc-4f11-a648-ab1d943d4639)

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

# Usage - trackTime (async helper)

`trackTime` wraps any sync or async function, automatically recording its duration as a Server-Timing metric. It returns the function's result directly.

```typescript
import { trackTime } from 'lambda-server-timing';

// Time an async database query
const user = await trackTime('db-query', async () => {
  return await dynamodb.get({ TableName: 'users', Key: { id } }).promise();
}, 'Fetch user from DynamoDB');

// Time an external API call
const data = await trackTime('external-api', async () => {
  const res = await fetch('https://api.example.com/data');
  return res.json();
});

// Also works with sync functions
const result = trackTime('compute', () => {
  return heavyComputation(input);
}, 'Heavy computation');
```

If the wrapped function throws an error, `trackTime` still records the timing before re-throwing, so you get visibility into failed operations too.