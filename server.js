const express = require('express');
const morgan = require('morgan')
const app = express();
const port = 4000;

if (process.env.ENV == "local") {
app.use(morgan('combined'))
}

app.use(express.static('./'));

app.listen(port, () => {
    console.log(`Contributoragreements Chooser listening at http://localhost:${port}`);
});

