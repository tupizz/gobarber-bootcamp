import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import Appointment from '../models/Appointment';
import File from '../models/File';
import Notification from '../schemas/Notification';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AppointmentController {
    async index(req, res) {
        const { page = 1 } = req.query;

        const appointments = await Appointment.findAll({
            where: { user_id: req.userId, canceled_at: null },
            attributes: ['id', 'date', 'canceled_at', 'past', 'cancelable'],
            order: ['date'],
            limit: 10,
            offset: (page - 1) * 10,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['url', 'path'],
                        },
                    ],
                },
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name', 'email'],
                    include: [
                        {
                            model: File,
                            as: 'avatar',
                            attributes: ['url', 'path'],
                        },
                    ],
                },
            ],
        });

        return res.json(appointments);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });

        if (!(await schema.isValid(req.body))) {
            res.status(422).json({ error: 'Validation fails' });
        }

        const { provider_id, date } = req.body;

        /**
         * Check id provider_id is an existing provider
         */
        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true },
        });

        if (!isProvider) {
            return res.status(401).json({
                error:
                    'You can only create appointments with an existing provider.',
            });
        }

        /**
         * Check if the appointment date is in the future
         */
        const hourStart = startOfHour(parseISO(date));
        if (isBefore(hourStart, new Date())) {
            return res.status(401).json({
                error: 'You can only create appointments in a future date.',
            });
        }

        /**
         * Check day availability
         */
        const checkAvailability = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            },
        });
        if (checkAvailability) {
            return res.status(401).json({
                error: 'Appointment date is not avaiable.',
            });
        }

        /**
         * Notify provider
         */

        const user = await User.findByPk(req.userId);
        const formattedDate = format(
            hourStart,
            "'dia' dd 'de' MMMM', às' H:mm'h'",
            { locale: pt }
        );

        await Notification.create({
            content: `Novo agendamento de ${user.name} para o ${formattedDate}`,
            user: provider_id,
        });

        const appointment = await Appointment.create({
            user_id: req.userId,
            provider_id,
            date,
        });

        return res.json(appointment);
    }

    async delete(req, res) {
        const appointment = await Appointment.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name', 'email'],
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'],
                },
            ],
        });

        if (appointment.user_id !== req.userId) {
            return res.status(401).json({
                error: "You're not the owner of this appointment",
            });
        }

        const dateWithSub = subHours(appointment.date, 2);
        if (isBefore(dateWithSub, new Date())) {
            return res.status(401).json({
                error: 'You can only cancel appointments 2 hours in advance',
            });
        }

        appointment.canceled_at = new Date();

        await appointment.save(appointment);

        await Queue.add(CancellationMail.key, {
            appointment,
        });

        return res.json(appointment);
    }
}

export default new AppointmentController();
