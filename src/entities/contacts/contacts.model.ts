import { Contact } from '../../../sequelize/sequelize.models';
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
        ??
        await Contact.findOne({
          where: {
            User_id: contact.Contact_User_id,
            Contact_User_id: contact.User_id
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
      const contact_as_User = await Contact.findAll(
        { where: { User_id: id } }
      )
      const contact_as_contact_User = await Contact.findAll(
        { where: { Contact_User_id: id } }
      )
      return [...contact_as_User, ...contact_as_contact_User]
    } catch (error) {
      throw new Error('Unable to find contacts')
    }
  }
}
