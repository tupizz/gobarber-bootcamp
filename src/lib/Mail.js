import nodemailer from 'nodemailer';
import { resolve } from 'path';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
import mailConfig from '../config/mail';

class Mail {
    constructor() {
        const { host, port, secure, auth } = mailConfig;
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth,
        });

        this.configureTemplates();
    }

    configureTemplates() {
        const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails');
        this.transporter.use(
            'compile',
            nodemailerhbs({
                viewEngine: exphbs.create({
                    layoutsDir: resolve(viewPath, 'layouts'),
                    partialsDir: resolve(viewPath, 'partials'),
                    defaultLayout: 'default',
                    extname: '.hbs',
                }),
                viewPath,
                extName: '.hbs',
            })
        );
    }

    sendMail(message) {
        try {
            this.transporter.sendMail({
                ...mailConfig.default,
                ...message,
            });
        } catch (error) {
            console.log(error);
        }
    }
}

export default new Mail();
