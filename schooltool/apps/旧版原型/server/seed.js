const db = require('./db');

// ============ 院校数据 ============

const schools = [
  // 四川党校
  {
    name: '四川省委党校', type: '党校', province: '四川',
    majors: JSON.stringify([
      { name: '政治学', enrollment: 300, directions: ['党建','科社','公共管理','应急管理','马哲实践','社会治理'], pass_rate: '10.9%' },
      { name: '经济学', enrollment: 200, directions: ['经济学','区域经济'], pass_rate: '10.5%' },
      { name: '法学', enrollment: 100, directions: ['党内法规','政府建设','法治社会'], pass_rate: '6.9%' }
    ]),
    fee: '7200元/年，三年共21600元', fee_num: 21600,
    enrollment: 600,
    pass_rate: '整体约9.6%（2025年有效报考9384人）',
    requirements: '四川省内在职人员；中共党员（含预备）；本科学历（学信网可查）；3年以上工龄',
    deadline: '每年3月开始报名，6月考试',
    notes: '民族地区专项150人（三州三县加15分）；排名制非过线制；300分满分260分主观题；已有硕士/党校研究生学历可免试'
  },
  // 重庆党校
  {
    name: '重庆市委党校', type: '党校', province: '重庆',
    majors: JSON.stringify([
      { name: '经济管理', enrollment: 200 },
      { name: '法律', enrollment: 200 },
      { name: '公共管理', enrollment: 170 },
      { name: '党政管理', enrollment: 170 },
      { name: '战略管理', enrollment: 160 }
    ]),
    fee: '8000元/年，三年共24000元', fee_num: 24000,
    enrollment: 900,
    pass_rate: '12%-14.7%（2025年报名6652人）',
    requirements: '重庆或四川在职人员；不要求党员；本科及以上学历；2年以上工龄',
    deadline: '每年3月报名，5-6月考试',
    notes: '四川人可报考；全部主观题无选择题；上岸分数线186-200分（满分300）；公管和党政参考书最薄'
  },
  // MPA院校
  {
    name: '四川大学', type: 'MPA', province: '四川',
    majors: JSON.stringify([{ name: 'MPA公共管理硕士' }]),
    fee: '约8.4万', fee_num: 84000, enrollment: 0,
    requirements: '本科毕业3年/专科毕业5年/硕士毕业2年',
    notes: '省市两级校友网络最强；遴选+本单位晋升都硬'
  },
  {
    name: '西南财经大学', type: 'MPA', province: '四川',
    majors: JSON.stringify([{ name: 'MPA公共管理硕士' }]),
    fee: '约8万', fee_num: 80000, enrollment: 0,
    requirements: '本科毕业3年/专科毕业5年/硕士毕业2年',
    notes: '财税金融系统校友统治力；系统对口首选'
  },
  {
    name: '西南交通大学', type: 'MPA', province: '四川',
    majors: JSON.stringify([{ name: 'MPA公共管理硕士' }]),
    fee: '约7万', fee_num: 70000, enrollment: 0,
    requirements: '本科毕业3年/专科毕业5年/硕士毕业2年',
    notes: '交通住建水利系统行业对口；2年制省时间'
  },
  {
    name: '重庆大学', type: 'MPA', province: '重庆',
    majors: JSON.stringify([{ name: 'MPA公共管理硕士' }]),
    fee: '约8万', fee_num: 80000, enrollment: 0,
    requirements: '本科毕业3年/专科毕业5年/硕士毕业2年',
    notes: '重庆系统最高认可度'
  },
  {
    name: '四川大学MBA', type: 'MBA', province: '四川',
    majors: JSON.stringify([{ name: 'MBA工商管理硕士' }]),
    fee: '约12-16万', fee_num: 140000, enrollment: 0,
    requirements: '本科毕业3年/专科毕业5年/硕士毕业2年',
    notes: '国企管理岗首选；企业系统MBA认可度高于MPA'
  },
  {
    name: '电子科技大学MBA', type: 'MBA', province: '四川',
    majors: JSON.stringify([{ name: 'MBA工商管理硕士' }]),
    fee: '约12万', fee_num: 120000, enrollment: 0,
    requirements: '本科毕业3年/专科毕业5年/硕士毕业2年',
    notes: '理工/科技系统对口'
  },
  {
    name: '四川师范大学', type: 'MPA', province: '四川',
    majors: JSON.stringify([{ name: '教育硕士' }, { name: 'MPA' }]),
    fee: '约5-6万', fee_num: 55000, enrollment: 0,
    notes: '教育系统校友密度远超985'
  },
  {
    name: '西南大学', type: 'MPA', province: '重庆',
    majors: JSON.stringify([{ name: '教育硕士' }, { name: 'MPA' }]),
    fee: '约6-8万', fee_num: 70000, enrollment: 0,
    notes: '重庆教育系统首选'
  }
];

// ============ 案例数据 ============

const cases = [
  // 党政机关
  {
    name: '王哥', age: 33, gender: '男', city: '成都', system_type: '党政机关',
    position: '某区财政局', education: '全日制本科', party_member: 1, work_years: 8,
    goal: '遴选', choice: '西南财经大学MPA',
    motivation: '想遴选到省厅，发现双证是硬性门槛',
    quote: '财政系统选西财，校友网络是隐性资源',
    outcome: '在读中', tags: JSON.stringify(['党政机关','全日制本科','遴选型','成都'])
  },
  {
    name: '张姐', age: 35, gender: '女', city: '绵阳', system_type: '党政机关',
    position: '某县组织部', education: '全日制本科', party_member: 1, work_years: 10,
    goal: '本单位晋升', choice: '四川省委党校·政治学（党建方向）',
    motivation: '组织部工作，干部培训对象需要研究生学历',
    quote: '组织考察时学历是过关项，不是加分项',
    outcome: '已上岸', tags: JSON.stringify(['党政机关','全日制本科','巩固型','地市州'])
  },
  // 乡镇/街道
  {
    name: '李哥', age: 28, gender: '男', city: '宜宾', system_type: '乡镇街道',
    position: '某乡镇综合岗', education: '全日制本科', party_member: 1, work_years: 5,
    goal: '遴选', choice: '四川大学MPA',
    motivation: '服务期刚满，想遴选到市直',
    quote: '服务期内读研是唯一能做的晋升准备',
    outcome: '备考中', tags: JSON.stringify(['乡镇街道','全日制本科','遴选型','地市州'])
  },
  {
    name: '刘姐', age: 31, gender: '女', city: '达州', system_type: '乡镇街道',
    position: '某街道社会事务岗', education: '非全日制本科', party_member: 1, work_years: 7,
    goal: '本单位晋升', choice: '四川省委党校·政治学（公共管理方向）',
    motivation: '新来的选调生985硕士起步，压力很大',
    quote: '不是为了跳槽，就是不想在评审的时候被一行字卡住',
    outcome: '已上岸', tags: JSON.stringify(['乡镇街道','非全日制本科','补短板型','地市州'])
  },
  // 公检法司
  {
    name: '陈哥', age: 34, gender: '男', city: '成都', system_type: '公检法司',
    position: '某区法院法官助理', education: '全日制本科', party_member: 1, work_years: 9,
    goal: '本单位晋升', choice: '四川省委党校·法学（法治社会方向）',
    motivation: '未入额走行政序列，学历在职级并行中是关键',
    quote: '法院未入额，走行政序列，学历这时候就是关键',
    outcome: '已上岸', tags: JSON.stringify(['公检法司','全日制本科','巩固型','成都'])
  },
  {
    name: '赵姐', age: 32, gender: '女', city: '重庆', system_type: '公检法司',
    position: '某区公安局', education: '全日制本科', party_member: 1, work_years: 8,
    goal: '本单位晋升', choice: '重庆市委党校·党政管理',
    motivation: '公安系统值班制，党校时间弹性更大',
    quote: '警衔和行政序列双轨都认党校学历',
    outcome: '在读中', tags: JSON.stringify(['公检法司','全日制本科','巩固型','重庆'])
  },
  // 教育/医疗
  {
    name: '杨姐', age: 36, gender: '女', city: '南充', system_type: '教育医疗',
    position: '某县医院护士', education: '非全日制本科', party_member: 1, work_years: 12,
    goal: '本单位晋升', choice: '四川省委党校·政治学',
    motivation: '周围同事几乎都是博士，只有极少数是本科，感受到了学历差距',
    quote: '拥有研究生学历能为我打开更多职业通道',
    outcome: '备考中', tags: JSON.stringify(['教育医疗','非全日制本科','补短板型','地市州'])
  },
  {
    name: '何老师', age: 38, gender: '女', city: '遂宁', system_type: '教育医疗',
    position: '某中学教师', education: '全日制本科', party_member: 1, work_years: 14,
    goal: '职称晋升', choice: '四川师范大学教育硕士',
    motivation: '中级评副高需要硕士学历缩短年限',
    quote: '教师评职称，双证硕士可以缩短2-3年',
    outcome: '在读中', tags: JSON.stringify(['教育医疗','全日制本科','职称型','地市州'])
  },
  // 国企/银行
  {
    name: '谭哥', age: 37, gender: '男', city: '成都', system_type: '国企银行',
    position: '某银行中后台', education: '非全日制本科', party_member: 1, work_years: 13,
    goal: '防御', choice: '四川省委党校·经济学',
    motivation: '财管部都是研究生，很多都是全日制包括领导，有清北的，压力很大',
    quote: '银行中后台，学历是唯一能自己决定的晋升变量',
    outcome: '已上岸', tags: JSON.stringify(['国企银行','非全日制本科','留后路型','成都'])
  },
  {
    name: '周哥', age: 39, gender: '男', city: '重庆', system_type: '国企银行',
    position: '某国企管理岗', education: '非全日制本科', party_member: 0, work_years: 15,
    goal: '本单位晋升', choice: '重庆市委党校·经济管理',
    motivation: '国企降薪潮下，先把能拿的硬件拿到手',
    quote: '不确定企业未来怎样，先拿个研究生学历留个底',
    outcome: '在读中', tags: JSON.stringify(['国企银行','非全日制本科','留后路型','重庆'])
  },
  // 民族地区
  {
    name: '阿布', age: 29, gender: '男', city: '甘孜', system_type: '乡镇街道',
    position: '某乡镇综合岗', education: '非全日制本科', party_member: 1, work_years: 5,
    goal: '本单位晋升', choice: '四川省委党校·政治学（民族专项）',
    motivation: '研究生在当地是稀缺标签，竞争上岗直接加分',
    quote: '150个民族地区专项名额，竞争强度远低于全省',
    outcome: '已上岸', tags: JSON.stringify(['乡镇街道','非全日制本科','性价比型','民族地区','甘孜'])
  },
  {
    name: '卓玛', age: 30, gender: '女', city: '阿坝', system_type: '党政机关',
    position: '某县政府办', education: '全日制本科', party_member: 1, work_years: 6,
    goal: '本单位晋升', choice: '四川省委党校·政治学（民族专项）',
    motivation: '县级机关编制少，研究生学历在当地含金量远高于成都',
    quote: '在当地就是研究生的含金量，远高于成都',
    outcome: '在读中', tags: JSON.stringify(['党政机关','全日制本科','性价比型','民族地区','阿坝'])
  },
  {
    name: '尔古', age: 27, gender: '男', city: '凉山', system_type: '乡镇街道',
    position: '某乡镇党建岗', education: '非全日制本科', party_member: 1, work_years: 4,
    goal: '本单位晋升', choice: '四川省委党校·政治学（民族专项）',
    motivation: '援彝干部服务期满提拔一级，学历是基础件',
    quote: '援彝4年回成都，这个证比任何关系都好使',
    outcome: '备考中', tags: JSON.stringify(['乡镇街道','非全日制本科','性价比型','民族地区','凉山'])
  },
  // 遴选转向型
  {
    name: '吴哥', age: 36, gender: '男', city: '泸州', system_type: '党政机关',
    position: '某县住建局', education: '全日制本科', party_member: 1, work_years: 11,
    goal: '防御', choice: '四川省委党校·经济学',
    motivation: '考了几年遴选没上岸，38岁新上限又给了希望，但先拿个研究生',
    quote: '就算不遴选也得有硕士，延退后还有25年要用',
    outcome: '已上岸', tags: JSON.stringify(['党政机关','全日制本科','遴选转向型','地市州'])
  },
  // 延退觉醒型
  {
    name: '钱姐', age: 41, gender: '女', city: '德阳', system_type: '党政机关',
    position: '某区人社局', education: '非全日制本科', party_member: 1, work_years: 17,
    goal: '防御', choice: '四川省委党校·政治学（公共管理方向）',
    motivation: '延退后还要干到63岁，学历投资回报期从5年变成20年',
    quote: '过去觉得快退休了读也没用，现在还有20多年要干',
    outcome: '在读中', tags: JSON.stringify(['党政机关','非全日制本科','延退觉醒型','地市州'])
  },
  // 非党员案例
  {
    name: '孙姐', age: 33, gender: '女', city: '成都', system_type: '国企银行',
    position: '某国企行政岗', education: '非全日制本科', party_member: 0, work_years: 9,
    goal: '本单位晋升', choice: '重庆市委党校·公共管理',
    motivation: '不是党员报不了四川党校，但重庆党校四川人也可以报',
    quote: '重庆党校不要求党员，学费也就多2400，值得',
    outcome: '已上岸', tags: JSON.stringify(['国企银行','非全日制本科','非党员','成都'])
  },
  // 事业编想转公务员
  {
    name: '马哥', age: 34, gender: '男', city: '乐山', system_type: '教育医疗',
    position: '某事业单位管理岗', education: '全日制本科', party_member: 1, work_years: 10,
    goal: '转公务员', choice: '四川大学MPA',
    motivation: '事业编调任公务员需要双证，党校学历不行',
    quote: '想转公务员，MPA双证是基础件，党校帮不上',
    outcome: '备考中', tags: JSON.stringify(['教育医疗','全日制本科','转公务员型','地市州'])
  },
  // 纪委选法学
  {
    name: '黄姐', age: 33, gender: '女', city: '眉山', system_type: '公检法司',
    position: '某县纪委监委', education: '全日制本科', party_member: 1, work_years: 8,
    goal: '本单位晋升', choice: '四川省委党校·法学（党内法规方向）',
    motivation: '纪委工作和党内法规直接相关，专业对口',
    quote: '纪委监委的人来考党校法学，背后逻辑就是专业对口',
    outcome: '已上岸', tags: JSON.stringify(['公检法司','全日制本科','巩固型','地市州'])
  },
  // 重庆党政机关
  {
    name: '田哥', age: 32, gender: '男', city: '重庆', system_type: '党政机关',
    position: '某区宣传部', education: '全日制本科', party_member: 1, work_years: 7,
    goal: '本单位晋升', choice: '重庆市委党校·党政管理',
    motivation: '宣传部工作，党政管理直接对口',
    quote: '重庆系统内读重庆党校，认可度最高',
    outcome: '在读中', tags: JSON.stringify(['党政机关','全日制本科','巩固型','重庆'])
  },
  // 上学记体验型
  {
    name: '林姐', age: 34, gender: '女', city: '成都', system_type: '党政机关',
    position: '某区政府办', education: '全日制本科', party_member: 1, work_years: 9,
    goal: '本单位晋升', choice: '四川省委党校·政治学（社会治理方向）',
    motivation: '上岸后才知道党校是真的在讲东西，不是走过场',
    quote: '全封闭管理，课程密集，老师都是博士教授，重新找回了读书的感觉',
    outcome: '在读中', tags: JSON.stringify(['党政机关','全日制本科','上学体验','成都'])
  }
];

// ============ 写入数据库 ============

const insertSchool = db.prepare(`
  INSERT OR REPLACE INTO schools (name, type, province, majors, fee, fee_num, enrollment, pass_rate, requirements, deadline, notes)
  VALUES (@name, @type, @province, @majors, @fee, @fee_num, @enrollment, @pass_rate, @requirements, @deadline, @notes)
`);

const insertCase = db.prepare(`
  INSERT OR REPLACE INTO cases (name, age, gender, city, system_type, position, education, party_member, work_years, goal, choice, motivation, quote, outcome, tags)
  VALUES (@name, @age, @gender, @city, @system_type, @position, @education, @party_member, @work_years, @goal, @choice, @motivation, @quote, @outcome, @tags)
`);

const seedAll = db.transaction(() => {
  db.exec('DELETE FROM schools');
  db.exec('DELETE FROM cases');
  for (const s of schools) {
    insertSchool.run({
      name: s.name, type: s.type, province: s.province || '',
      majors: s.majors || '[]', fee: s.fee || '', fee_num: s.fee_num || 0,
      enrollment: s.enrollment || 0, pass_rate: s.pass_rate || '',
      requirements: s.requirements || '', deadline: s.deadline || '',
      notes: s.notes || ''
    });
  }
  for (const c of cases) {
    insertCase.run(c);
  }
});

seedAll();
console.log(`Seeded ${schools.length} schools and ${cases.length} cases.`);
