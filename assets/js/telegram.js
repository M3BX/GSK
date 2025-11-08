document.getElementById('telegramForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  // ВАШИ ДАННЫЕ (замените на реальные!)
  const botToken = 'ВАШ_ТОКЕН_БОТА'; // Например: 123456789:AABBCCDDEEFFGGHHIIJJKKLLMMNNOO
  const chatId = 'ВАШ_ID_ЧАТА';       // Например: -1001234567890

  const text = encodeURIComponent(
    `📧 Новое сообщение с сайта\n\n` +
    `Имя: ${name}\n` +
    `Email: ${email}\n` +
    `Сообщение:\n${message}`
  );

  const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${text}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const resultDiv = document.getElementById('result');
      if (data.ok) {
        resultDiv.innerHTML = '<p class="success">Сообщение отправлено!</p>';
        document.getElementById('telegramForm').reset();
      } else {
        resultDiv.innerHTML = `<p class="error">Ошибка: ${data.description || 'Неизвестная ошибка'}</p>`;
      }
    })
    .catch(error => {
      document.getElementById('result').innerHTML = '<p class="error">Сеть недоступна или ошибка подключения.</p>';
    });
});


