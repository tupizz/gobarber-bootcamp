import User from '../models/User';

class UserController {
    async update(req, res) {
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
