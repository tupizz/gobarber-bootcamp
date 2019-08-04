import User from '../models/User';
import File from '../models/File';

class ProviderController {
    async index(req, res) {
        const users = await User.findAll({
            where: { provider: true },
            attributes: ['id', 'name', 'email', 'provider'],
            include: [
                {
                    model: File,
                    as: 'avatar',
                    attributes: ['id', 'name', 'url', 'path'],
                },
            ],
        });
        return res.json(users);
    }
}

export default new ProviderController();
