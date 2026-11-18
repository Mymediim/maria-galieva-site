const heroScene = document.querySelector('.hero-portrait-scene');

if (heroScene && 'IntersectionObserver' in window) {
  const heroTrigger = window.matchMedia('(max-width: 760px)').matches
    ? heroScene.querySelector('.hero-portrait-question')
    : heroScene;
  heroScene.classList.add('is-ready');
  const heroObserver = new IntersectionObserver(([entry], observer) => {
    if (entry.intersectionRatio < 0.45) return;

    heroScene.classList.replace('is-ready', 'is-playing');
    observer.disconnect();
  }, { threshold: 0.45 });

  heroObserver.observe(heroTrigger);
}

const scenarios = [
  [
    "Разработать новую страницу на сайте",
    "Добавить страницу услуги на существующий сайт в его стиле",
    "Около 1 недели",
    "Дизайнер готовит макет, разработчик верстает страницу и добавляет её на сайт.",
    "1 день · 5–6 ч",
    "С готовыми материалами и доступом ИИ помогает собрать страницу. Ты проверяешь её на телефоне и компьютере и публикуешь.",
    "≈ 25 000 ₽",
    "Ориентир за дизайн и вёрстку 1 страницы у подрядчика."
  ],
  [
    "Разобрать итоги созвона",
    "Получить список задач, ответственных и сроков",
    "60 мин",
    "Переслушиваешь запись, чтобы понять, кто что обещал.",
    "15 мин",
    "Даёшь ИИ расшифровку. Он собирает задачи и письмо. Ты сверяешь договорённости.",
    "≈ 6 000 ₽",
    "8 созвонов в месяц, 6 ч экономии."
  ],
  [
    "Обновить цены в 3 000 строках Excel",
    "Сопоставить позиции по артикулу",
    "4 ч",
    "Поставщик поменял порядок столбцов. Приходится сверять цены вручную.",
    "45 мин",
    "Проверяешь правило на нескольких строках, применяешь ко всему файлу и разбираешь исключения.",
    "≈ 6 500 ₽",
    "2 обновления в месяц, 6 ч 30 мин экономии."
  ],
  [
    "Подготовить КП новому клиенту",
    "Собрать предложение по запросу и прайсу",
    "90 мин",
    "Копируешь старое КП и ищешь, где осталось имя прошлого клиента.",
    "30 мин",
    "ИИ собирает черновик из запроса, шаблона и прайса. Ты проверяешь цены и условия.",
    "≈ 8 000 ₽",
    "8 предложений в месяц, 8 ч экономии."
  ],
  [
    "Ответить на отзывы",
    "Увидеть, на что чаще всего жалуются клиенты",
    "40 мин",
    "Проверяешь площадки по очереди и снова отвечаешь на «ждали 40 минут».",
    "15 мин",
    "Сводка собирает отзывы с подключённых площадок. ИИ группирует жалобы и предлагает ответы.",
    "≈ 1 667 ₽",
    "4 проверки в месяц, 1 ч 40 мин экономии."
  ],
  [
    "Подготовить посты на неделю",
    "Собрать план и черновики публикаций",
    "3 ч",
    "В пятницу открываешь пустой документ: за неделю ничего не опубликовали.",
    "1 ч",
    "Даёшь ИИ акции, вопросы клиентов и рабочие истории. Получаешь план и черновики.",
    "≈ 8 000 ₽",
    "4 подборки в месяц, 8 ч экономии."
  ],
  [
    "Написать страницу услуги с голоса",
    "Превратить голосовую заметку в черновик для сайта",
    "2 ч",
    "Откладываешь текст: нужно вспомнить всё важное и собрать из этого страницу.",
    "45 мин",
    "Рассказываешь, с чем приходят клиенты. ИИ собирает черновик, ты добавляешь примеры.",
    "≈ 1 250 ₽",
    "1 черновик в месяц, 1 ч 15 мин экономии."
  ],
  [
    "Найти условия в папке с договорами",
    "Получить ответ со ссылкой на исходный документ",
    "30 мин",
    "Открываешь «Финал», «Финал новый» и «Финал точно».",
    "5 мин",
    "Спрашиваешь, какие условия согласовали. ИИ находит ответ, ты сверяешь его с документом.",
    "≈ 1 667 ₽",
    "4 поиска в месяц, 1 ч 40 мин экономии."
  ],
  [
    "Найти счета без актов",
    "Получить список документов, которые нужно запросить",
    "2 ч",
    "Переносишь суммы из PDF и вручную ищешь счета без актов.",
    "40 мин",
    "ИИ собирает черновик реестра. Ты сверяешь отмеченные пропуски и расхождения с оригиналами.",
    "≈ 2 667 ₽",
    "2 проверки в месяц, 2 ч 40 мин экономии."
  ],
  [
    "Найти дубли в каталоге",
    "Сверить спорные позиции",
    "5 ч",
    "«Кабель 2 м» и «Кабель 2м» выглядят как разные товары.",
    "90 мин",
    "ИИ приводит названия к общему формату и отмечает дубли. Ты проверяешь спорные позиции.",
    "≈ 3 500 ₽",
    "1 сверка в месяц, 3 ч 30 мин экономии."
  ]
];

let index = 0;
const scenarioSelect = document.querySelector('#scenario-select');
const scenarioFields = [
  '#scenario-title', '#scenario-task', '#before-value', '#before-detail',
  '#after-value', '#after-detail', '#impact-value', '#impact-detail',
].map(selector => document.querySelector(selector));
const scenarioCount = document.querySelector('#count');

function render(next) {
  index = (next + scenarios.length) % scenarios.length;
  scenarios[index].forEach((value, field) => {
    scenarioFields[field].textContent = value;
  });
  scenarioCount.textContent = (index + 1) + ' из ' + scenarios.length;
  scenarioSelect.value = String(index);
}

scenarioSelect.addEventListener('change', () => render(Number(scenarioSelect.value)));
document.querySelector('#prev').addEventListener('click', () => render(index - 1));
document.querySelector('#next').addEventListener('click', () => render(index + 1));
render(0);

const applicationForm = document.querySelector('#question-form');
const submitApplication = applicationForm.querySelector('button[type="submit"]');
const applicationStatus = document.querySelector('#application-status');
const tariffSelect = document.querySelector('#application-tariff');

const sourceField = applicationForm.elements.namedItem('source');
const contactFormId = applicationForm.dataset.contactFormId;
let formOpenedAt = Math.floor(Date.now() / 1000);

document.querySelectorAll('[data-application-source]').forEach((link) => {
  link.addEventListener('click', () => {
    sourceField.value = link.dataset.applicationSource;
    tariffSelect.value = link.dataset.tariff ?? '';
  });
});

function showApplicationStatus(message) {
  applicationStatus.hidden = false;
  applicationStatus.textContent = message;
}

applicationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitApplication.disabled) return;

  const endpoint = applicationForm.dataset.endpoint.trim();
  if (!endpoint) {
    showApplicationStatus('Отправка пока недоступна. Напишите Марии в Telegram.');
    return;
  }

  const fields = new FormData(applicationForm);
  for (const field of ['name', 'email', 'message']) {
    const value = String(fields.get(field) ?? '').trim();
    if (!value) {
      showApplicationStatus('Заполните имя, почту и описание задачи.');
      return;
    }
    fields.set(field, value);
  }

  if (contactFormId) {
    fields.set('_wpcf7_unit_tag', 'wpcf7-f' + contactFormId + '-o1');
    fields.set('_itprod_ts', String(formOpenedAt));
    fields.set('website_url', '');
  }

  submitApplication.disabled = true;
  submitApplication.textContent = 'Отправляем…';
  showApplicationStatus('');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fields,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 429) {
      showApplicationStatus('Слишком много попыток. Подождите и попробуйте снова.');
      return;
    }
    if (!response.ok) throw new Error('Submission failed');
    const result = await response.json();
    if (result?.status !== 'mail_sent') throw new Error('Submission not confirmed');

    applicationForm.reset();
    formOpenedAt = Math.floor(Date.now() / 1000);
    showApplicationStatus('Заявка отправлена');
  } catch {
    showApplicationStatus('Не удалось подтвердить отправку. Попробуйте снова или напишите в Telegram.');
  } finally {
    submitApplication.disabled = false;
    submitApplication.textContent = 'Отправить заявку';
  }
});
