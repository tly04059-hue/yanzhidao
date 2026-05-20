const db = require('./db');

// ============ 排除规则 & 提示 ============

function getWarnings(answers) {
  const warnings = [];
  const { region, party_member, system, goal, education, age, position } = answers;

  // 非党员+四川 → 排除四川党校
  if (region === '四川' && party_member === '否') {
    warnings.push({
      type: 'block_sc',
      text: '四川党校要求中共党员身份（含预备党员），你目前不符合。但在四川工作满2年、拥有本科学历的非党员可报考重庆党校（不要求党员），学费2.4万，或选择MPA双证。'
    });
  }

  // 目标=遴选+推荐了党校
  if (goal === '遴选') {
    warnings.push({
      type: 'info',
      text: '遴选只认国民教育序列学历（双证），党校学历在遴选中不被认可。如果遴选是你的核心目标，MPA双证是必选项。'
    });
  }

  // 事业编教师/医护+党校
  if (system === '教育医疗' && (position === '教师' || position === '医护')) {
    warnings.push({
      type: 'info',
      text: '党校学历在职称评审中一般不被认可。如果你需要评副高/正高，双证硕士可缩短2-3年任职年限，性价比更高。'
    });
  }

  // 大专学历
  if (education === '大专') {
    warnings.push({
      type: 'block_edu',
      text: '四川党校要求本科学历（学信网可查），单大专暂不符合。建议先提升本科学历，或咨询重庆党校是否接受。MPA需本科毕业3年或大专毕业5年。'
    });
  }

  // 法学无背景提示
  // (在专业推荐时动态添加)

  // 遴选年龄提醒（区分川渝）
  if (goal === '遴选') {
    if (region === '重庆' && (age === '36-40岁' || age === '41岁以上')) {
      warnings.push({
        type: 'info',
        text: '重庆市级遴选年龄上限为35岁（2025年公告），你可能已超龄。建议转向本单位晋升路径，党校研究生在职级并行、竞争上岗中同样认可。如有特殊岗位放宽，以当年公告为准。'
      });
    } else if (region === '四川' && age === '41岁以上') {
      warnings.push({
        type: 'info',
        text: '四川省直遴选年龄上限为40岁（2025年公告），中央遴选科员级38岁、副科级43岁、处级46岁。建议关注当年公告具体要求，同时党校学历在本单位晋升中同样认可。'
      });
    }
  }

  // 乡镇+25-30岁：服务期提醒
  if (system === '乡镇街道' && age === '25-30岁') {
    warnings.push({
      type: 'info',
      text: '乡镇公务员有5年最低服务期，期间不能调动、遴选。读在职研究生是服务期内唯一能做的晋升准备——不是可选项，是刚需。'
    });
  }

  // 国企想转公务员
  if (goal === '转公务员') {
    warnings.push({
      type: 'info',
      text: '国企/事业编调任公务员需要副处级或副高职称+组织推荐，MPA双证是基础件。党校学历无法满足调任的学历要求。'
    });
  }

  return warnings;
}

// ============ 专业匹配 ============

function matchSichuanMajor(answers) {
  const { position, system } = answers;

  // 法治/普法/信访/法律相关
  const lawPositions = ['法治普法', '信访调解', '司法行政'];
  if (lawPositions.includes(position)) {
    return { major: '法学', direction: '法治社会', note: '法学招生仅100人，过考率6.9%为最低，需要一定法律基础' };
  }

  // 公安系统 → 政治学（社会治理）或法学
  if (position === '公安') {
    return { major: '政治学', direction: '社会治理', alt_major: '法学', alt_direction: '法治社会',
      note: '公安系统走警衔+行政双轨，党校学历两轨都认。政治学招生多、过考率高，更稳妥' };
  }

  // 法院/检察院 → 法学优先
  if (position === '法院检察院') {
    return { major: '法学', direction: '法治社会', alt_major: '政治学', alt_direction: '社会治理',
      note: '法检系统法学对口度最高。未入额走行政序列的，政治学也可以。法学招生仅100人，过考率6.9%，注意风险' };
  }

  // 纪委监委 → 可选法学（党内法规）或政治学
  if (position === '纪委监委') {
    return { major: '法学', direction: '党内法规', alt_major: '政治学', alt_direction: '社会治理',
      note: '纪委工作与党内法规直接相关。如无法律基础，政治学也是好选择（招生多、过考率高）' };
  }

  // 财政/经济/金融相关
  const econPositions = ['财政局', '发改委', '统计局', '经信局', '金融监管', '金融业务岗'];
  if (econPositions.includes(position)) {
    return { major: '经济学', direction: '经济学', note: '不考数学，是政治经济学。经济学备考资料量最小，入门比法学容易' };
  }

  // 应急相关
  if (position === '应急管理') {
    return { major: '政治学', direction: '应急管理', note: '直接对口应急管理方向' };
  }

  // 组织部/宣传部/统战部/机关党委/国企党委办/党建岗
  const partyPositions = ['组织部', '宣传部', '统战部', '机关党委', '党务岗', '党建岗'];
  if (partyPositions.includes(position)) {
    return { major: '政治学', direction: '党建', note: '着眼党的队伍和组织体系建设，干部培训对象优先' };
  }

  // 民政/人社/街道办/社区/综合岗/社会事务岗
  const publicPositions = ['人社局', '民政局', '综合岗', '社会事务岗', '社区管理'];
  if (publicPositions.includes(position) || system === '乡镇街道') {
    return { major: '政治学', direction: '公共管理', note: '覆盖基层治理核心内容，招生最多（300人），过考率最高（10.9%）' };
  }

  // 默认推荐政治学
  return { major: '政治学', direction: '公共管理', note: '政治学招生最多、覆盖面最广、入门门槛最低，是最稳妥的选择' };
}

function matchChongqingMajor(answers) {
  const { position, system } = answers;

  // 法律相关
  const lawPositions = ['法治普法', '信访调解', '司法行政', '法院检察院'];
  if (lawPositions.includes(position)) {
    return { major: '法律', note: '有法学背景优先' };
  }

  // 公安系统
  if (position === '公安') {
    return { major: '公共管理', note: '公安系统走警衔+行政双轨，公共管理覆盖面最广' };
  }

  // 经济/金融相关
  const econPositions = ['财政局', '发改委', '统计局', '经信局', '金融监管', '金融业务岗'];
  if (econPositions.includes(position)) {
    return { major: '经济管理', note: '有经济基础或直接工作需要' };
  }

  // 组织/宣传/纪委/统战/党务
  const partyPositions = ['组织部', '宣传部', '纪委监委', '统战部', '机关党委', '党务岗', '党建岗'];
  if (partyPositions.includes(position)) {
    return { major: '党政管理', note: '覆盖面最大，干部培训对象优先考虑' };
  }

  // 发改/政研/外事/战略
  const stratPositions = ['发改委', '政研室', '外事办'];
  if (stratPositions.includes(position) && position === '发改委') {
    return { major: '战略管理', note: '着眼领导能力与前瞻布局' };
  }

  // 民政/人社/应急/街道办/社区/乡镇
  if (system === '乡镇街道' || ['人社局', '民政局', '应急管理', '综合岗', '社会事务岗', '社区管理'].includes(position)) {
    return { major: '公共管理', note: '最广泛的拓展性，适合所有体制内人员。参考书最薄，备考资料量最小' };
  }

  // 国企管理岗
  if (system === '国企银行') {
    return { major: '经济管理', note: '企业管理对口' };
  }

  // 默认
  return { major: '公共管理', note: '公共管理具有最广泛的拓展性，适合所有在公共部门工作的同学。参考书最薄' };
}

function matchMPA(answers) {
  const { region, position, system } = answers;

  if (region === '重庆') {
    return { school: '重庆大学', major: 'MPA公共管理硕士', fee: '约8万', note: '重庆系统最高认可度' };
  }

  // 财税金融系统
  const finPositions = ['财政局', '统计局', '金融监管', '金融业务岗'];
  if (finPositions.includes(position)) {
    return { school: '西南财经大学', major: 'MPA公共管理硕士', fee: '约8万', note: '财税金融系统校友统治力' };
  }

  // 交通/住建
  if (['交通住建', '水利'].includes(position)) {
    return { school: '西南交通大学', major: 'MPA公共管理硕士', fee: '约7万', note: '行业对口+2年制' };
  }

  // 教育系统
  if (system === '教育医疗' && position === '教师') {
    return { school: '四川师范大学', major: '教育硕士', fee: '约5-6万', note: '教育系统校友密度远超985' };
  }

  // 国企 → MBA
  if (system === '国企银行' && (position === '管理岗' || position === '技术岗')) {
    return { school: '四川大学MBA', major: 'MBA工商管理硕士', fee: '约12-16万', note: '企业系统MBA认可度高于MPA' };
  }

  // 默认川大
  return { school: '四川大学', major: 'MPA公共管理硕士', fee: '约8.4万', note: '省市两级校友网络最强' };
}

// ============ 案例匹配 ============

function matchCase(answers) {
  const allCases = db.prepare('SELECT * FROM cases').all();
  if (!allCases.length) return null;

  const scored = allCases.map(c => {
    let score = 0;
    // 系统相同 30%
    if (c.system_type === answers.system) score += 30;
    // 目标相同 25%
    if (c.goal === answers.goal) score += 25;
    // 学历类型相同 20%
    const isNonFull = answers.education === '非全日制本科';
    const caseIsNonFull = c.education === '非全日制本科';
    if (isNonFull === caseIsNonFull) score += 20;
    // 地区相近 15%
    if (answers.region === '重庆' && c.city === '重庆') score += 15;
    else if (answers.region === '四川' && c.city !== '重庆') score += 10;
    if (answers.city_type === '民族地区' && c.tags && c.tags.includes('民族地区')) score += 15;
    // 年龄相近 10%
    const ageMap = { '25-30岁': 28, '31-35岁': 33, '36-40岁': 38, '41岁以上': 43 };
    const userAge = ageMap[answers.age] || 33;
    if (c.age && Math.abs(c.age - userAge) <= 5) score += 10;
    // 非党员案例匹配
    if (answers.party_member === '否' && c.party_member === 0) score += 20;

    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

// ============ 主推荐函数 ============

// ============ 话术切换（学历类型） ============

function getEducationTone(answers) {
  if (answers.education === '非全日制本科') {
    return {
      partySchoolPrefix: '不让学历成为你唯一的短板。',
      partySchoolSuffix: '档案里多一笔实打实的研究生学历，在职级并行和竞争上岗中不被比下去。',
      mpaPrefix: '双证硕士是从非全日制本科到研究生学历的质变。'
    };
  }
  return {
    partySchoolPrefix: '让你的优势更明显。',
    partySchoolSuffix: '巩固现有条件，在组织考察和竞争上岗中更有底气。',
    mpaPrefix: '双证MPA让你的学历优势扩展到更多场景。'
  };
}

// ============ 事业编专技岗检测 ============

function isZhuanJiGang(answers) {
  return answers.system === '事业编' && answers.position === '专技岗';
}

// ============ 主推荐函数 ============

function recommend(answers) {
  const warnings = getWarnings(answers);
  const canUseSichuan = answers.region === '四川' && answers.party_member !== '否' && answers.education !== '大专';
  const isChongqing = answers.region === '重庆';
  const tone = getEducationTone(answers);

  // 事业编专技岗：强制提醒党校学历在职称评审中不认
  if (isZhuanJiGang(answers)) {
    warnings.push({
      type: 'info',
      text: '你走专技岗（职称路线），党校学历在职称评审中一般不被认可。双证硕士可缩短评副高年限2-3年，建议优先考虑MPA/学科对口硕士。'
    });
  }

  let primary = null;
  let alternative = null;

  // 事业编专技岗 → 强制MPA优先（不管目标是什么）
  if (isZhuanJiGang(answers) && answers.goal !== '遴选' && answers.goal !== '转公务员' && answers.goal !== '职称晋升') {
    const mpa = matchMPA(answers);
    primary = {
      school: mpa.school, major: mpa.major, fee: mpa.fee,
      reason: `${tone.mpaPrefix}你走专技岗，职称评审认国民教育序列学历（双证），不认党校学历。硕士可缩短评副高年限2-3年。${mpa.note}`,
      type: 'MPA'
    };
    if (canUseSichuan) {
      const sc = matchSichuanMajor(answers);
      alternative = {
        school: '四川省委党校', major: `${sc.major}（${sc.direction}）`, fee: '2.16万/3年',
        reason: `如果你未来转管理岗，党校学历在管理岗竞争上岗中认可。${tone.partySchoolSuffix}`,
        type: '党校'
      };
    }
  }
  // 目标：遴选 / 转公务员 → MPA优先
  else if (answers.goal === '遴选' || answers.goal === '转公务员') {
    const mpa = matchMPA(answers);
    primary = {
      school: mpa.school, major: mpa.major, fee: mpa.fee,
      reason: `${tone.mpaPrefix}你的目标是${answers.goal === '遴选' ? '遴选到上级机关' : '转公务员'}，双证MPA是硬性要求。${mpa.note}`,
      type: 'MPA'
    };
    // 备选：党校（如果符合条件）
    if (canUseSichuan) {
      const sc = matchSichuanMajor(answers);
      alternative = {
        school: '四川省委党校', major: `${sc.major}（${sc.direction}）`, fee: '2.16万/3年',
        reason: `如果同时想在本单位晋升有保障，党校学历在竞争上岗、职级并行中也认可。${tone.partySchoolSuffix}性价比高4倍。`,
        type: '党校'
      };
    } else if (isChongqing || answers.party_member === '否') {
      const cq = matchChongqingMajor(answers);
      alternative = {
        school: '重庆市委党校', major: cq.major, fee: '2.4万/3年',
        reason: `如果不遴选想在本单位稳步走，重庆党校${answers.party_member === '否' ? '不要求党员（需在川工作满2年、本科学历），' : ''}性价比很高。${tone.partySchoolSuffix}`,
        type: '党校'
      };
    }
  }
  // 目标：本单位晋升 / 防御 / 职称 → 看系统
  else {
    // 职称晋升（事业编教师/医护）→ 双证优先
    if (answers.goal === '职称晋升') {
      const mpa = matchMPA(answers);
      primary = {
        school: mpa.school, major: mpa.major, fee: mpa.fee,
        reason: `职称评审认国民教育序列学历（双证），不认党校学历。${mpa.note}`,
        type: 'MPA'
      };
      if (canUseSichuan) {
        const sc = matchSichuanMajor(answers);
        alternative = {
          school: '四川省委党校', major: `${sc.major}（${sc.direction}）`, fee: '2.16万/3年',
          reason: `如果你走管理岗而非专技岗，党校学历在管理岗竞争上岗中认可。`,
          type: '党校'
        };
      }
    }
    // 本单位晋升 / 防御 → 党校优先
    else {
      if (canUseSichuan) {
        const sc = matchSichuanMajor(answers);
        primary = {
          school: '四川省委党校', major: `${sc.major}（${sc.direction}）`, fee: '2.16万/3年',
          reason: `${tone.partySchoolPrefix}${sc.note}${tone.partySchoolSuffix}`,
          type: '党校'
        };
        // 法学推荐时额外警告
        if (sc.major === '法学') {
          warnings.push({
            type: 'caution',
            text: '法学招生仅100人，过考率6.9%为三个专业中最低。如果没有法律基础，建议慎选，可考虑政治学（招生300人，过考率10.9%）。'
          });
        }
        // 备选MPA
        const mpa = matchMPA(answers);
        alternative = {
          school: mpa.school, major: mpa.major, fee: mpa.fee,
          reason: `如果未来想保留遴选的可能，MPA双证是必备的。${mpa.note}`,
          type: 'MPA'
        };
      } else if (isChongqing) {
        const cq = matchChongqingMajor(answers);
        primary = {
          school: '重庆市委党校', major: cq.major, fee: '2.4万/3年',
          reason: `${tone.partySchoolPrefix}${cq.note}${tone.partySchoolSuffix}`,
          type: '党校'
        };
        const mpa = matchMPA(answers);
        alternative = {
          school: mpa.school, major: mpa.major, fee: mpa.fee,
          reason: `如果未来想遴选或跨系统流动，${tone.mpaPrefix}MPA双证是必备的。`,
          type: 'MPA'
        };
      } else {
        // 非党员四川 → 重庆党校
        const cq = matchChongqingMajor(answers);
        primary = {
          school: '重庆市委党校', major: cq.major, fee: '2.4万/3年',
          reason: `四川党校要求党员身份，重庆党校不要求党员（需在川工作满2年、本科学历即可报考）。${tone.partySchoolPrefix}${cq.note}`,
          type: '党校'
        };
        const mpa = matchMPA(answers);
        alternative = {
          school: mpa.school, major: mpa.major, fee: mpa.fee,
          reason: `如果预算允许，${tone.mpaPrefix}MPA双证的认可范围更广。`,
          type: 'MPA'
        };
      }
    }
  }

  // 预算过滤：如果预算2-3万但推荐了MPA作首选，交换
  if (answers.budget === '2-3万' && primary && primary.type === 'MPA' && alternative && alternative.type === '党校') {
    [primary, alternative] = [alternative, primary];
    primary.reason = '基于你的预算，党校是性价比最高的选择。' + primary.reason;
    alternative.reason = '如果预算可以增加，' + alternative.reason;
  }

  // 民族地区额外信息
  let extraInfo = '';
  if (answers.city_type === '民族地区' && answers.region === '四川') {
    extraInfo = '你在民族地区工作，可享受150个民族地区专项名额（竞争强度远低于全省）。三州三县（甘孜/阿坝/凉山/北川/马边/峨边）还可总分加15分。';
  }

  // 关键信息（根据首选推荐院校匹配，不是根据用户地区）
  const isSichuanPartySchool = primary.school === '四川省委党校';
  const isChongqingPartySchool = primary.school === '重庆市委党校';
  const isMPA = primary.type === 'MPA';

  let deadline = '';
  let examType = '';
  let passRate = '';

  if (isSichuanPartySchool) {
    deadline = '四川党校每年3月开始报名，6月考试';
    examType = '排名制考试（不是过线制）。300分满分，260分主观题，需要大量文字输出能力';
    passRate = '2025年有效报考9384人，录取600人，整体录取率约9.6%（待人工核实）。按专业：政治学约10.9%、经济学约10.5%、法学约6.9%。研知道入班辅导过考率40.4%，1对1辅导过考率86.3%';
  } else if (isChongqingPartySchool) {
    deadline = '重庆党校每年3月开始报名，5-6月考试';
    examType = '排名制考试。300分满分，全部主观题无选择题';
    passRate = '2025年报名6652人，录取900人，整体录取率12%-14.7%，上岸分数线186-200分。研知道入班辅导过考率44%，1对1辅导过考率86.3%';
  } else if (isMPA) {
    deadline = 'MPA每年10月报名（研招网），12月全国统考';
    examType = '199管理类联考（数学+逻辑+写作）+ 英语二';
    passRate = '';
  }

  const keyInfo = { deadline, examType, passRate };

  // MPA/MBA提示：1对1咨询可提供全国范围择校
  if (isMPA) {
    warnings.push({
      type: 'info',
      text: '以上推荐为川渝范围内院校。MPA/MBA为全国统考，可报考全国任何招生院校。如需更大范围的择校意见，建议预约1对1咨询。'
    });
  }

  // 匹配案例
  const matchedCase = matchCase(answers);

  return {
    primary,
    alternative,
    warnings,
    extraInfo,
    keyInfo,
    case: matchedCase ? {
      name: matchedCase.name,
      age: matchedCase.age,
      city: matchedCase.city,
      position: matchedCase.position,
      education: matchedCase.education,
      choice: matchedCase.choice,
      motivation: matchedCase.motivation,
      quote: matchedCase.quote,
      outcome: matchedCase.outcome
    } : null
  };
}

module.exports = { recommend };
