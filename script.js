// Параметры Telegram‑бота
const botToken = '8548673788:AAE2JVyOLMj9Cdr4_OC8BMyjJsQcBjV50cM';
const chatId = '1621067774';

// Регулярное выражение для проверки формата номера бокса
const boxNumberPattern = /^(\d+|\d+-\d+)$/;

// Загрузка показаний из data.json
async function loadReadings() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Не удалось загрузить data.json');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Ошибка загрузки показаний:', error);
    return [];
  }
}

// Загрузка платежей из payments.json
async function loadPayments() {
  try {
    const response = await fetch('payments.json');
    if (!response.ok) throw new Error('Не удалось загрузить payments.json');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Ошибка загрузки платежей:', error);
    return [];
  }
}

// Отображение показаний бокса
function displayReadings(filteredReadings) {
  const container = document.getElementById('readings-results');
  if (!container) {
    console.error('Элемент #readings-results не найден!');
    return;
  }

  if (filteredReadings.length === 0) {
    container.innerHTML = '<p class="no-data">Показания не найдены</p>';
    return;
  }

  filteredReadings.sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = `
    <h3>Показания бокса</h3>
    <table>
      <thead>
        <tr>
          <th>Показания</th>
          <th>Дата</th>
        </tr>
      </thead>
      <tbody>
  `;

  filteredReadings.forEach(item => {
    const reading = Number.isInteger(item.reading) ? item.reading : 0;
    const date = new Date(item.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    html += `
      <tr>
        <td>${reading}</td>
        <td>${date}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Отображение платежей по боксу
function displayPayments(filteredPayments) {
  const container = document.getElementById('payments-results');
  if (!container) {
    console.error('Элемент #payments-results не найден!');
    return;
  }

  if (filteredPayments.length === 0) {
    container.innerHTML = '<p class="no-data">Платежи не найдены</p>';
    return;
  }

  filteredPayments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  let html = `
    <h3>Платежи по боксу</h3>
    <table>
      <thead>
        <tr>
          <th>Сумма (₽)</th>
          <th>Дата платежа</th>
        </tr>
      </thead>
      <tbody>
  `;

  filteredPayments.forEach(item => {
    const paymentDate = new Date(item.payment_date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    html += `
      <tr>
        <td>${item.paid.toFixed(2)}</td>
        <td>${paymentDate}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Получение тарифа из последних показаний бокса
async function getTariffForBox(boxNumber) {
  const readings = await loadReadings();
  const relevantReadings = readings
    .filter(item => item.box_number === boxNumber)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return relevantReadings.length > 0 ? relevantReadings[0].tf : null;
}

// Расчёт расхода и суммы к оплате (исправленная версия)
async function calculateUsageAndPayment(boxNumber, currentReading) {
  const readings = await loadReadings();
  console.log('Readings:', readings);
  const payments = await loadPayments();
  console.log('Payments:', payments);

  // Фильтруем показания для данного бокса
  const relevantReadings = readings.filter(item => item.box_number === boxNumber);
  console.log('Relevant Readings:', relevantReadings);

  if (relevantReadings.length === 0) {
    throw new Error('Нет показаний для расчёта.');
  }

  // Сортируем по дате (от старых к новым)
  const sortedReadings = [...relevantReadings].sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log('Sorted Readings:', sortedReadings);

  // Берём последнее сохранённое показание
  const lastSavedReading = Number(sortedReadings[sortedReadings.length - 1].reading);
  console.log('Last Saved Reading:', lastSavedReading);

  // Если currentReading не передан, используем последнее сохранённое показание
  const currentReadingNum = currentReading !== undefined 
    ? Number(currentReading) 
    : lastSavedReading;
  console.log('Current Reading:', currentReadingNum);

  // Расчёт текущего расхода: разница между текущим показанием и последним сохранённым
  const currentUsage = currentReadingNum - lastSavedReading;
  console.log('Current Usage:', currentUsage);

  if (currentUsage < 0) {
    throw new Error(`Текущие показания меньше последних сохранённых. Проверьте ввод.`);

  }

  // Получаем тариф (берём из последних показаний)
  const tf = await getTariffForBox(boxNumber);
  if (tf === null) {
    throw new Error('Тариф не найден.');
  }
  console.log('Tariff:', tf);

  // Сумма к оплате за текущий период
  const totalDue = currentUsage * tf;
  console.log('Total Due:', totalDue);

  // Суммируем все оплаченные суммы для этого бокса
  const paidTotal = payments
    .filter(item => item.box_number === boxNumber)
    .reduce((sum, item) => sum + item.paid, 0);
  console.log('Paid Total:', paidTotal);

  // Остаток к оплате: сумма за текущий период минус оплаченное


  // 2. Считаем суммарный результат по всем парам
  let totalResult = 0;

  for (let i = 0; i < sortedReadings.length - 1; i++) {
    const current = sortedReadings[i];
    const next = sortedReadings[i + 1];

    // Проверяем наличие необходимых полей
    if (current.reading == null || next.reading == null || next.tf == null) {
      console.warn(`Пропущена пара из-за отсутствующих данных`, current, next);
      continue;
    }

    const deltaReading = next.reading - current.reading;
    const tariff = next.tf;
    const pairResult = deltaReading * tariff;

    totalResult += pairResult;
  }

  // 3. Выводим итоговую сумму
  console.log(totalResult); // В вашем примере: 980

  const remaining = totalResult + totalDue - paidTotal;
  console.log('Remaining:', remaining);


  return {
    currentUsage,  // текущий расход (между последним и текущим показанием)
    totalDue,    // сумма к оплате за текущий период
    paidTotal,   // сумма уже оплаченного
    remaining,   // остаток к оплате
    tf           // тариф
  };
}




// Отправка данных в Telegram
async function sendToTelegram(boxNumber, reading, comment) {
  // Получаем тариф
  const tf = await getTariffForBox(boxNumber);
  if (tf === null) {
    document.getElementById('telegramResult').innerHTML = `
      <p style="color: red;">Ошибка: тариф не найден. Введите предыдущие показания с тарифом в data.json.</p>
    `;
    return;
  }

  const data = {
    box_number: boxNumber,
    reading: reading,
    tf: tf,
    date: new Date().toISOString(),
    comment: comment || ''
  };

  const jsonString = JSON.stringify(data, null, 2);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${jsonString}\n`
      })
    });

    const result = await response.json();
    if (result.ok) {
      const calculation = await calculateUsageAndPayment(boxNumber, reading);

      console.log('Calculation result:', calculation);

      const calcText = `
        <strong>Бокс ${boxNumber}. Расчёт:</strong><br>
        - Расход: ${calculation.currentUsage} кВт·ч<br>
        - Тариф: ${calculation.tf} ₽/кВт·ч<br>
        - Начисленно: ${calculation.totalDue.toFixed(2)} ₽<br>
        - К оплате: ${calculation.remaining.toFixed(2)} ₽
      `;

      document.getElementById('telegramResult').innerHTML = `
        <div>${calcText}</div>
      `;
    } else {
      throw new Error(result.description || 'Неизвестная ошибка');
    }
  } catch (error) {
    document.getElementById('telegramResult').innerHTML = `
      <p style="color: red;">Ошибка: ${error.message}</p>
    `;
  }
}

// Обработчик формы
document.getElementById('boxFormCombined').addEventListener('submit', async function(e) {
  e.preventDefault();

  const submittedButton = e.submitter;
  const action = submittedButton.value;

  const boxNumberInput = document.getElementById('boxNumber');
  const readingInput = document.getElementById('reading');
  const commentInput = document.getElementById('comment');

  const boxNumberStr = boxNumberInput.value.trim();
  const readingStr = readingInput.value.trim();
  const comment = commentInput.value.trim();

  let boxNumber, reading;
  let isValid = true;
  let errorMessage = '';

  if (action === 'send') {
    // Валидация для отправки
    if (!boxNumberStr) {
      isValid = false;
      errorMessage = 'Введите номер бокса';
    } else {
      boxNumber = parseInt(boxNumberStr);
      if (isNaN(boxNumber) || boxNumber < 1) {
        isValid = false;
        errorMessage = 'Номер бокса должен быть целым числом ≥ 1';
      }
    }

    if (!readingStr) {
      isValid = false;
      errorMessage = 'Введите показания';
    } else {
      reading = parseInt(readingStr);
      if (isNaN(reading) || reading < 0) {
        isValid = false;
        errorMessage = 'Показания должны быть целым числом ≥ 0';
      }
    }
  } else if (action === 'show') {
    // Валидация только для номера бокса при показе данных
    if (!boxNumberStr) {
      isValid = false;
      errorMessage = 'Введите номер бокса';
    } else {
      boxNumber = parseInt(boxNumberStr);
      if (isNaN(boxNumber) || boxNumber < 1) {
        isValid = false;
        errorMessage = 'Номер бокса должен быть целым числом ≥ 1';
      }
    }
  }


    if (!isValid) {
        document.getElementById('telegramResult').innerHTML = `
          <p style="color: red;">${errorMessage}</p>
        `;
        return;
    }

    try {
        if (action === 'send') {
            await sendToTelegram(boxNumber, reading, comment);
        } else if (action === 'show') {
            const readings = await loadReadings();
            const payments = await loadPayments();

            if (!Array.isArray(readings) || !Array.isArray(payments)) {
                document.getElementById('telegramResult').innerHTML = `
                  <p style="color: red;">Ошибка загрузки данных. Проверьте файлы data.json и payments.json.</p>
                `;
                return;
            }

            const filteredReadings = readings.filter(item => item.box_number === boxNumber);
            const filteredPayments = payments.filter(item => item.box_number === boxNumber);

            displayReadings(filteredReadings);
            displayPayments(filteredPayments);
        }
    } catch (error) {
        console.error('Ошибка обработки формы:', error);
        document.getElementById('telegramResult').innerHTML = `
          <p style="color: red;">Произошла ошибка: ${error.message}</p>
        `;
    }
});

// Инициализация: очищаем результаты при загрузке страницы
window.addEventListener('load', () => {
    document.getElementById('telegramResult').innerHTML = '';
    document.getElementById('readings-results').innerHTML = '';
    document.getElementById('payments-results').innerHTML = '';
});

// Дополнительная функция для сохранения данных
// async function saveReading(boxNumber, reading, tf, comment) {
//     try {
//         const currentReadings = await loadReadings();
//         const newReading = {
//             box_number: boxNumber,
//             reading: reading,
//             tf: tf,
//             date: new Date().toISOString(),
//             comment: comment
//         };
        
//         const updatedReadings = [...currentReadings, newReading];
        
//         // Здесь должен быть код для сохранения в data.json
//         // Например:
//         // await fetch('data.json', {
//         //     method: 'PUT',
//         //     headers: {
//         //         'Content-Type': 'application/json'
//         //     },
//         //     body: JSON.stringify(updatedReadings)
//         // });
//     } catch (error) {
//         console.error('Ошибка сохранения показаний:', error);
//     }
// }