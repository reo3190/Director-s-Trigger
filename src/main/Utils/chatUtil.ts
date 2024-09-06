import axios from 'axios';

export const sendChat = async (roomID: string, message: string) => {
  try {
    const tagMessage = `[info]${message}[/info]`;
    const response = await axios.post(
      'http://192.168.11.79:3050/send',
      { roomID, message: tagMessage },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('POSTエラー:', error);
    throw error;
  }
};
