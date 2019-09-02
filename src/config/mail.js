export default {
    host: process.env.MAIL_HOST,
    post: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    default: {
        from: 'Equipe Gobarber <noreply@gobarber.com.br>',
    },
};
