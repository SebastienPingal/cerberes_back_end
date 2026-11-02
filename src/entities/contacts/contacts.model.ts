import { User, Contact } from '../../../sequelize/sequelize.models';
import { IContact } from '../../types';


export default class contact {
  static async create_one(contact: IContact) {
    try {
      const existing_contact =
        await Contact.findOne({
          where: {
            User_id: contact.User_id,
            Contact_User_id: contact.Contact_User_id
          }
        })

      if (existing_contact) {
        throw new Error('Contact already exists');
      }
      await Contact.create(contact) as IContact
      return await Contact.findOne({
        where: {
          User_id: contact.User_id,
          Contact_User_id: contact.Contact_User_id
        }
      })

    } catch (error) {
      throw new Error('Unable to create contact')
    }
  }

  static async find_all_by_user_id(id: number) {
    try {
      const contacts = await Contact.findAll({
        where: {
          User_id: id,
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['User_id', 'User_name', 'identity_public_key']
        }]
      }) as IContact[];

      return contacts;
    } catch (error) {
      throw new Error('Unable to find contacts');
    }
  }
}
