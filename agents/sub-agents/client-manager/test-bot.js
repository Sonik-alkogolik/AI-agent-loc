import axios from 'axios';

async function testBot() {
  const token = '8544334987:AAGS-ONeRlDuHiq1CRKjLxXbHSk_igyymaw';
  
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    console.log('✅ Бот работает!');
    console.log('ID:', response.data.result.id);
    console.log('Имя:', response.data.result.first_name);
    console.log('Username:', response.data.result.username);
    console.log('Может читать сообщения:', response.data.result.can_read_messages || false);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testBot();
