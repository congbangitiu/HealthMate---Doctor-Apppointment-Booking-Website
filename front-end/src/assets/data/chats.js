import { faker } from '@faker-js/faker';

const chats = [
    {
        type: 'msg',
        message: 'Hi 👋🏻, How are ya ?',
        status: 'incoming',
    },
    {
        type: 'divider',
        text: 'Today',
    },
    {
        type: 'msg',
        message: 'Hi 👋 Panda, not bad, u ?',
        status: 'outgoing',
    },
    {
        type: 'msg',
        message: 'Can you send me an abstract image?',
        status: 'outgoing',
    },
    {
        type: 'msg',
        message: 'Ya sure, sending you a pic',
        status: 'incoming',
    },
    {
        type: 'msg',
        subtype: 'img',
        message: 'Here You Go',
        img: faker.image.url({ width: 640, height: 480, category: 'abstract' }),
        status: 'incoming',
    },
    {
        type: 'msg',
        message: 'Can you please send this in file format?',
        status: 'outgoing',
    },
    {
        type: 'msg',
        subtype: 'doc',
        message: 'Yes sure, here you go.',
        status: 'incoming',
    },
    {
        type: 'msg',
        subtype: 'link',
        preview: faker.image.url({ width: 640, height: 480, category: 'cats' }),
        message: 'Yep, I can also do that',
        status: 'incoming',
    },
    {
        type: 'msg',
        subtype: 'reply',
        reply: 'This is a reply',
        message: 'Yep, I can also do that',
        status: 'outgoing',
    },
];

export default chats;
