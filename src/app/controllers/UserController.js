import * as Yup from 'yup';
import User from '../models/User';

class UserController {
    async update(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
            avatar_id: Yup.number(),
            oldPassword: Yup.string().min(3),
            password: Yup.string()
                .min(3)
                .when('oldPassword', (oldPassword, field) =>
                    oldPassword ? field.required() : field
                ),
        });

        if (!(await schema.isValid(req.body))) {
            res.status(422).json({ error: 'Validation fails' });
        }

        const { email, oldPassword } = req.body;

        const user = await User.findByPk(req.userId);

        if (email !== user.email) {
            const userExists = await User.findOne({
                where: { email: req.body.email },
            });

            if (userExists) {
                res.status(400).json({ error: 'User already exists' });
            }
        }

        if (oldPassword && !user.checkPassword(oldPassword)) {
            return res.status(401).json({ error: 'Password does not match' });
        }

        const { id, name, email: emailFromDb, provider } = await user.update(
            req.body
        );

        return res.json({ id, email: emailFromDb, name, provider });
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string()
                .email()
                .required(),
            password: Yup.string()
                .required()
                .min(3),
        });

        if (!(await schema.isValid(req.body))) {
            res.status(422).json({ error: 'Validation fails' });
        }

        const userExists = await User.findOne({
            where: { email: req.body.email },
        });

        if (userExists) {
            res.status(400).json({ error: 'User already exists' });
        }
        const { id, name, email, provider } = await User.create(req.body);

        return res.json({
            id,
            name,
            email,
            provider,
        });
    }
}

export default new UserController();
