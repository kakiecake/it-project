import express from 'express';
import * as exphbs from 'express-handlebars';
import path from 'path'

const app = express();

app.engine('hbs', exphbs.engine({
    extname: '.hbs',      // Set the extension to .hbs instead of .handlebars
    defaultLayout: 'main' // Set default layout (optional)
}));

app.set('view engine', 'hbs');

app.get('/', (_, res) => {
    res.render('home', {
        title: 'Home Page',
        message: 'Welcome to our website!'
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});


