import express, { Response, Request } from 'express';
import { FakeSOSocket } from '../types/socket';
import { AddMessageRequest, Message } from '../types/types';
import { saveMessage, getMessages } from '../services/message.service';

const messageController = (socket: FakeSOSocket) => {
  const router = express.Router();

  /**
   * Checks if the provided message request contains the required fields.
   *
   * @param req The request object containing the message data.
   *
   * @returns `true` if the request is valid, otherwise `false`.
   */
  const isRequestValid = (req: AddMessageRequest): boolean =>
    req.body.messageToAdd !== undefined &&
    req.body.messageToAdd.msg !== undefined &&
    req.body.messageToAdd.msg.trim() !== '' &&
    req.body.messageToAdd.msgFrom !== undefined &&
    req.body.messageToAdd.msgFrom.trim() !== '' &&
    req.body.messageToAdd.msgDateTime !== undefined;

  /**
   * Validates the Message object to ensure it contains the required fields.
   *
   * @param message The message to validate.
   *
   * @returns `true` if the message is valid, otherwise `false`.
   */
  const isMessageValid = (message: Message): boolean =>
    message.msg !== undefined &&
    message.msg.trim() !== '' &&
    message.msgFrom !== undefined &&
    message.msgFrom.trim() !== '' &&
    message.msgDateTime !== undefined;

  /**
   * Handles adding a new message. The message is first validated and then saved.
   * If the message is invalid or saving fails, the HTTP response status is updated.
   *
   * @param req The AddMessageRequest object containing the message and chat data.
   * @param res The HTTP response object used to send back the result of the operation.
   *
   * @returns A Promise that resolves to void.
   */
  const addMessageRoute = async (req: AddMessageRequest, res: Response): Promise<void> => {
    if (!isRequestValid(req)) {
      res.status(400).send('Invalid request');
      return;
    }

    const { messageToAdd: msg } = req.body;

    if (!isMessageValid(msg)) {
      res.status(400).send('Invalid request');
      return;
    }

    try {
      const msgFromDb = await saveMessage(msg);

      if ('error' in msgFromDb) {
        throw new Error(msgFromDb.error);
      }

      socket.emit('messageUpdate', { msg: msgFromDb });

      res.json(msgFromDb);
    } catch (err: unknown) {
      res.status(500).send(`Error when adding a message: ${(err as Error).message}`);
    }
  };

  /**
   * Fetch all messages in ascending order of their date and time.
   * @param req The request object.
   * @param res The HTTP response object used to send back the messages.
   * @returns A Promise that resolves to void.
   */
  const getMessagesRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const messages = await getMessages();
      res.json(messages);
    } catch (err: unknown) {
      res.status(500).send(`Error when getting messages: ${(err as Error).message}`);
    }
  };

  // Add appropriate HTTP verbs and their endpoints to the router
  router.post('/addMessage', addMessageRoute);
  router.get('/getMessages', getMessagesRoute);

  return router;
};

export default messageController;
