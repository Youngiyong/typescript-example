# WebHook Handler

## Overview

### Architecture
```
// workflow dooray to clickup
:dooray event -> webhook(slack format) -> lambda -> request to clickup api

// workflow clickup to dooray
: clickup event(automation) -> webhook(clickup format) -> lambda -> request to dooray api
```

### Function syncTask