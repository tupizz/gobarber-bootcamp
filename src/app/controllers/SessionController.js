import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User';
import authConfig from '../../config/auth';

class SessionController {
    async store(req, res) {
        const schema = Yup.object().shape({
            email: Yup.string()
                .email()
                .required(),
            password: Yup.string()
                .min(3)
                .required(),
        });

        if (!(await schema.isValid(req.body))) {
            res.status(422).json({ error: 'Validation fails' });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.checkPassword(password)) {
            return res.status(403).json({ error: 'Password does not match' });
        }

        const { id, name } = user;

        const token = jwt.sign({ id, email }, authConfig.secret, {
            expiresIn: authConfig.expiresIn,
        });

        return res.json({
            user: { id, name, email },
            token,
        });
    }
}

export default new SessionController();
