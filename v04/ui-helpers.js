(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MonsterWorldV04UI = api;
})(typeof globalThis !== 'undefined' ? globalThis : self, function () {
  'use strict';

  const ACTIONS = {
    idle: 'бездействует',
    wait: 'ждёт',
    wander: 'бродит без срочной цели',
    roam: 'исследует окрестности',
    move: 'перемещается',
    flee: 'убегает',
    retreat: 'отступает',
    hide: 'прячется',
    rest: 'отдыхает',
    sleep: 'спит',
    graze: 'пасётся',
    forage: 'ищет пищу',
    'forage-root': 'ищет съедобные корни',
    'seek-food': 'ищет пищу',
    seekFood: 'ищет пищу',
    eat: 'ест',
    feed: 'питается',
    scavenge: 'разделывает тушу',
    'eat-carcass': 'ест тушу',
    'steal-piece': 'пытается утащить часть туши',
    hunt: 'охотится',
    stalk: 'крадётся к добыче',
    'pack-hunt': 'охотится вместе со стаей',
    attack: 'атакует',
    bite: 'кусает',
    maul: 'терзает противника',
    ambush: 'готовит засаду',
    'tunnel-ambush': 'готовит подземную засаду',
    'horn-charge': 'разгоняется для удара рогами',
    'guard-carcass': 'охраняет тушу',
    roar: 'рычит и отпугивает соперников',
    circle: 'кружит в поисках пищи',
    'alarm-call': 'подаёт тревожный сигнал',
    'herd-call': 'зовёт стадо',
    regroup: 'возвращается к группе',
    follow: 'следует за сородичем',
    mate: 'ищет пару',
    reproduce: 'размножается',
    burrow: 'роет ход',
    photosynthesize: 'накапливает энергию света',
    'root-network': 'подключается к корневой сети',
    'spore-cloud': 'распыляет споры',
    'energy-pulse': 'выпускает энергетический импульс',
    dead: 'мёртв',
    rebirth: 'ожидает перерождения',
    'rebirth-wait': 'ожидает перерождения',
    active: 'активен',
    asleep: 'спит',
    dormant: 'неактивен',
    limited: 'работает с ограничением',
    pulse: 'включается короткими импульсами',
    damaged: 'повреждён'
  };

  const REASONS = {
    'no more urgent goal': 'нет более срочной цели',
    'no urgent goal': 'нет срочной цели',
    'nearby superior threat': 'рядом находится значительно более сильная угроза',
    'superior threat nearby': 'рядом находится значительно более сильная угроза',
    hungry: 'проголодался',
    hunger: 'нужна пища',
    starving: 'критически голоден',
    starvation: 'умирает от голода',
    wounded: 'ранен и пытается восстановиться',
    'low energy': 'осталось мало энергии',
    'carcass nearby': 'рядом обнаружена туша',
    'food nearby': 'рядом есть подходящая пища',
    'prey nearby': 'рядом обнаружена добыча',
    'target lost': 'цель потеряна',
    'ready to reproduce': 'готов к размножению',
    'partner nearby': 'рядом подходящий партнёр',
    'group nearby': 'пытается держаться рядом с группой',
    'too far from group': 'слишком далеко отошёл от группы',
    ceiling: 'достиг текущего потолка развития',
    cap: 'достиг текущего потолка развития',
    injury: 'тяжёлое состояние тела блокирует развитие',
    zone: 'энергия зоны подавляет развитие',
    metamorphosis: 'идёт перестройка тела',
    'no target': 'подходящая цель не найдена',
    'unsafe area': 'место кажется опасным',
    'edge pressure': 'пытается вернуться в обитаемую область'
  };

  const CAUSES = {
    starvation: 'голод',
    combat: 'бой',
    killed: 'убийство',
    predation: 'нападение хищника',
    'old-age': 'старость',
    oldAge: 'старость',
    disease: 'болезнь',
    poison: 'отравление',
    'soul-collapse': 'разрушение души',
    test: 'техническая проверка',
    unknown: 'неизвестная причина'
  };

  const DIETS = {
    herbivore: 'травоядное',
    carnivore: 'хищник',
    scavenger: 'падальщик',
    omnivore: 'всеядное',
    photosynthetic: 'энергетическая форма'
  };

  const SOCIAL = {
    herd: 'стадное',
    pack: 'стайное',
    solitary: 'одиночное',
    flock: 'собирается в стаи',
    family: 'семейное',
    colony: 'колониальное'
  };

  const EVENT_WORDS = [
    ['starvation', 'голод'],
    ['rebirth', 'перерождение'],
    ['death', 'смерть'],
    ['born', 'рождение'],
    ['birth', 'рождение'],
    ['mutation', 'мутация'],
    ['named', 'получение имени'],
    ['killed', 'убит'],
    ['ceiling', 'потолок развития'],
    ['flee', 'бегство'],
    ['wander', 'бродит']
  ];

  function cleanKey(value) {
    return String(value ?? '').trim();
  }

  function humanizeFallback(value) {
    const raw = cleanKey(value);
    if (!raw) return 'нет данных';
    return raw
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .toLowerCase();
  }

  function translateFrom(map, value) {
    const key = cleanKey(value);
    if (!key) return 'нет данных';
    if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
    const lower = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(map, lower)) return map[lower];
    return humanizeFallback(key);
  }

  function translateAction(value) { return translateFrom(ACTIONS, value); }
  function translateReason(value) { return translateFrom(REASONS, value); }
  function translateCause(value) { return translateFrom(CAUSES, value); }
  function translateDiet(value) { return translateFrom(DIETS, value); }
  function translateSocial(value) { return translateFrom(SOCIAL, value); }

  function translateText(value) {
    let text = cleanKey(value);
    if (!text) return '';
    for (const [english, russian] of EVENT_WORDS) {
      text = text.replace(new RegExp(`\\b${english}\\b`, 'gi'), russian);
    }
    return text;
  }

  function clamp(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }

  function percent(value, digits = 0) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    const normalized = number <= 1 && number >= -1 ? number * 100 : number;
    return `${normalized.toFixed(digits)}%`;
  }

  function number(value, digits = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '—';
    return parsed.toLocaleString('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function compactNumber(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '—';
    if (Math.abs(parsed) < 1000) return number(parsed, Math.abs(parsed) < 100 ? 1 : 0);
    return new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(parsed);
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function creatureTitle(creature, species) {
    if (!creature) return 'Существо';
    const base = species?.name || creature.speciesName || creature.speciesId || 'Существо';
    if (creature.name) return creature.name;
    const numberValue = creature.number ?? String(creature.id || '').replace(/\D+/g, '');
    return numberValue ? `${base} №${numberValue}` : base;
  }

  function getCurrentAction(creature, snapshot) {
    return creature?.action
      ?? creature?.currentAction
      ?? creature?.intent?.action
      ?? snapshot?.action
      ?? snapshot?.currentAction
      ?? 'idle';
  }

  function getCurrentReason(creature, snapshot) {
    return creature?.reason
      ?? creature?.actionReason
      ?? creature?.intent?.reason
      ?? snapshot?.reason
      ?? snapshot?.actionReason
      ?? 'no more urgent goal';
  }

  function explainCreature(creature, snapshot, species) {
    if (!creature) {
      return {
        headline: 'Выбери существо на карте',
        details: ['Клик выбирает ближайшее существо, поэтому теперь не нужно попадать точно в маленькую точку.'],
        tone: 'neutral'
      };
    }

    const alive = creature.alive !== false && snapshot?.alive !== false;
    if (!alive) {
      const cause = creature.deathCause ?? snapshot?.deathCause ?? creature.lastDeathCause ?? 'unknown';
      return {
        headline: `Сейчас ожидает перерождения`,
        details: [`Последняя причина смерти: ${translateCause(cause)}.`],
        tone: 'danger'
      };
    }

    const action = translateAction(getCurrentAction(creature, snapshot));
    const reason = translateReason(getCurrentReason(creature, snapshot));
    const hunger = Number(snapshot?.hunger ?? creature.hunger ?? 0);
    const energy = Number(snapshot?.energy ?? creature.energy ?? 0);
    const hp = Number(snapshot?.hp ?? creature.hp ?? 0);
    const maxHp = Number(snapshot?.maxHp ?? creature.maxHp ?? 1);
    const level = Number(snapshot?.level ?? creature.level ?? 0);
    const cap = Number(snapshot?.supportedLevelCap ?? creature.supportedLevelCap ?? level);
    const details = [`${action[0].toUpperCase()}${action.slice(1)}, потому что ${reason}.`];

    if (cap <= level + 0.01) details.push('Дальнейший рост уровня сейчас упирается в потолок постоянного потенциала.');
    else details.push(`Имеет запас примерно ${Math.max(0, Math.floor(cap - level))} уровней, которые ещё можно постепенно выразить.`);
    if (hunger >= 75) details.push('Голод уже опасен и заметно влияет на выбор действий.');
    else if (hunger >= 45) details.push('Скоро придётся искать пищу.');
    if (energy <= 25) details.push('Запас энергии низкий, поэтому активные действия ограничены.');
    if (maxHp > 0 && hp / maxHp < 0.5) details.push('Существо серьёзно ранено.');
    if (species) details.push(`${translateDiet(species.diet)}, поведение: ${translateSocial(species.social)}.`);

    let tone = 'neutral';
    if (hunger >= 75 || (maxHp > 0 && hp / maxHp < 0.35)) tone = 'danger';
    else if (hunger >= 45 || energy <= 30) tone = 'warn';
    else if (cap > level + 1) tone = 'good';

    return { headline: `${creatureTitle(creature, species)}: ${action}`, details, tone };
  }

  function normalizePoint(entity) {
    if (!entity) return null;
    const x = Number(entity.x ?? entity.position?.x ?? entity.targetX);
    const y = Number(entity.y ?? entity.position?.y ?? entity.targetY);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }

  function findNearest(screenX, screenY, candidates, radius = 22) {
    let best = null;
    let bestDistance = radius;
    for (const candidate of candidates || []) {
      const x = Number(candidate.screenX);
      const y = Number(candidate.screenY);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const distance = Math.hypot(screenX - x, screenY - y);
      const allowed = Math.max(radius, Number(candidate.hitRadius) || 0);
      if (distance <= allowed && distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    return best;
  }

  function boundaryDiagnostics(world) {
    const creatures = typeof world?.aliveCreatures === 'function'
      ? world.aliveCreatures()
      : (world?.creatures || []).filter((creature) => creature.alive !== false);
    const center = world?.center || { x: (world?.width || 0) / 2, y: (world?.height || 0) / 2 };
    const radius = Number(world?.radius || Math.min(world?.width || 0, world?.height || 0) * 0.5);
    const outside = [];
    const nearBoundary = [];
    for (const creature of creatures) {
      const point = normalizePoint(creature);
      if (!point || !radius) continue;
      const ratio = Math.hypot(point.x - center.x, point.y - center.y) / radius;
      if (ratio > 1.005) outside.push({ creature, ratio });
      else if (ratio > 0.96) nearBoundary.push({ creature, ratio });
    }
    return { total: creatures.length, outside, nearBoundary, outsideRatio: creatures.length ? outside.length / creatures.length : 0 };
  }

  function eventCategory(event) {
    const raw = `${event?.type || ''} ${event?.message || event?.text || ''}`.toLowerCase();
    if (/death|killed|starvation|смерт|убит|голод/.test(raw)) return 'death';
    if (/birth|born|offspring|рожд/.test(raw)) return 'birth';
    if (/rebirth|перерожд/.test(raw)) return 'rebirth';
    if (/mutation|мутац/.test(raw)) return 'mutation';
    if (/name|named|имя|именн/.test(raw)) return 'name';
    if (/combat|attack|battle|бой|атак/.test(raw)) return 'combat';
    return 'other';
  }

  function eventMessage(event) {
    if (!event) return '';
    return translateText(event.message ?? event.text ?? event.description ?? String(event));
  }

  return Object.freeze({
    ACTIONS,
    REASONS,
    CAUSES,
    translateAction,
    translateReason,
    translateCause,
    translateDiet,
    translateSocial,
    translateText,
    clamp,
    percent,
    number,
    compactNumber,
    formatTime,
    creatureTitle,
    getCurrentAction,
    getCurrentReason,
    explainCreature,
    normalizePoint,
    findNearest,
    boundaryDiagnostics,
    eventCategory,
    eventMessage
  });
});
