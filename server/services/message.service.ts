import MessageModel from '../models/messages.model';
import { Message, MessageResponse } from '../types/types';

/**
 * Saves a new message to the database.
 *
 * @param {Message} message - The message to save
 *
 * @returns {Promise<MessageResponse>} - The saved message or an error message
 */
export const saveMessage = async (message: Message): Promise<MessageResponse> => {
  try {
    const savedMessage = await MessageModel.create(message);
    return savedMessage;
  } catch (error) {
    return { error: `Error when saving message: ${error}` };
  }
};

/**
 * Retrieves all messages from the database, sorted by date in ascending order.
 *
 * @returns {Promise<Message[]>} - An array of messages. If an error occurs, an empty array is returned.
 */
export const getMessages = async (): Promise<Message[]> => {
  try {
    const messages: Message[] = await MessageModel.find({});
    
    messages.sort((messageA, messageB) => {
      const dateA = messageA.msgDateTime.getTime();
      const dateB = messageB.msgDateTime.getTime();
      return dateA - dateB;
    });

    return messages;
  } catch (error) {
    return [];
  }
};
