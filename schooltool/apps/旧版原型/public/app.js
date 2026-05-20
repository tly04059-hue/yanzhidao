const { createApp } = Vue;

createApp({
  data() {
    return {
      stage: 'intro',
      currentStep: 0,
      uuid: '',
      answers: {},
      result: null,
      isLoading: false,
      showLeadForm: false,
      leadForm: { wechat: '', phone: '' },
      submitting: false,
      leadSuccess: false,
      loadingText: '正在分析你的情况...',
      inlineWarning: '',

      questions: [
        {
          key: 'region',
          title: '你在哪个省份工作？',
          subtitle: '四川和重庆的可选院校不同',
          options: [
            { value: '四川', label: '四川' },
            { value: '重庆', label: '重庆' }
          ]
        },
        {
          key: 'system',
          title: '你属于哪类体制？',
          options: [
            { value: '公务员', label: '公务员', desc: '行政编制' },
            { value: '参公', label: '参公事业编', desc: '参照公务员管理' },
            { value: '事业编', label: '事业编', desc: '全额/差额拨款' },
            { value: '教育医疗', label: '教育/医疗', desc: '教师、医护人员' },
            { value: '国企银行', label: '国企/银行', desc: '国有企业、城投、银行' },
            { value: '乡镇街道', label: '乡镇/街道', desc: '基层工作人员' }
          ]
        },
        {
          key: 'education',
          title: '你的最高学历是？',
          subtitle: '不同学历影响可选院校和报考条件',
          options: [
            { value: '全日制本科', label: '全日制本科', desc: '统招本科' },
            { value: '非全日制本科', label: '非全日制本科', desc: '自考/成考/网教/电大' },
            { value: '大专', label: '大专', desc: '全日制或非全日制大专' }
          ]
        },
        {
          key: 'party_member',
          title: '你是中共党员吗？',
          subtitle: '含预备党员',
          options: [
            { value: '是', label: '是（含预备党员）' },
            { value: '否', label: '不是' }
          ]
        },
        {
          key: 'age',
          title: '你的年龄段？',
          options: [
            { value: '25-30岁', label: '25-30岁' },
            { value: '31-35岁', label: '31-35岁' },
            { value: '36-40岁', label: '36-40岁' },
            { value: '41岁以上', label: '41岁以上' }
          ]
        },
        {
          key: 'goal',
          title: '你读研的核心目标是？',
          subtitle: '选最重要的一个',
          options: [
            { value: '本单位晋升', label: '本单位晋升', desc: '竞争上岗、职级并行' },
            { value: '遴选', label: '遴选到上级机关', desc: '省级/市级遴选' },
            { value: '职称晋升', label: '职称评审', desc: '评副高/正高需要硕士' },
            { value: '转公务员', label: '想转公务员', desc: '国企/事业编调任行政编' },
            { value: '防御', label: '防御性学历', desc: '周围人都在考，不能落后' }
          ]
        },
        {
          key: 'budget',
          title: '你能接受的学费预算？',
          subtitle: '3年总费用',
          options: [
            { value: '2-3万', label: '2-3万', desc: '党校在职研究生' },
            { value: '5-8万', label: '5-8万', desc: 'MPA/教育硕士' },
            { value: '8万以上', label: '8万以上', desc: 'MBA/名校MPA' }
          ]
        },
        {
          key: 'position',
          title: '你的岗位方向？',
          subtitle: '选最接近的一项',
          options: []
        }
      ],

      policyNotes: [
        {
          title: '延迟退休稳妥实施',
          text: '职业后半段拉长，37-42岁读研依然划算，投资回报期20+年。35岁读研还有25年用，40岁也不晚。'
        },
        {
          title: '"投资于人"写进政府报告',
          text: '学历通胀加速，本科在体制内正在贬值。学历门槛只升不降，早读比晚读好。'
        },
        {
          title: '成渝双城经济圈提升能级',
          text: '跨区域竞争和流动加速，选成渝两地都认的学校（川大/重大）更有战略价值。'
        },
        {
          title: '事业单位深化改革',
          text: '"铁饭碗"正被重新定义，学历和职称是不确定时代最确定的筹码。事业编优先双证硕士。'
        },
        {
          title: '基层减负+继续教育',
          text: '政策鼓励在职学习，单位普遍支持。现在读的阻力最小，领导不会为难你。'
        }
      ]
    };
  },

  computed: {
    totalSteps() {
      return this.questions.length;
    },
    currentQuestion() {
      const q = this.questions[this.currentStep];
      if (q.key === 'position') {
        q.options = this.getPositionOptions();
      }
      return q;
    }
  },

  methods: {
    async startQuiz() {
      try {
        const res = await fetch('/api/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: new URLSearchParams(location.search).get('from') || '' })
        });
        const data = await res.json();
        this.uuid = data.uuid;
      } catch (e) {
        this.uuid = 'local-' + Date.now();
      }
      this.stage = 'quiz';
      this.$nextTick(() => this.scrollToQuestion(0));
    },

    getOptions(q) {
      if (q.key === 'position') return this.getPositionOptions();
      return q.options;
    },

    getAnswerLabel(key) {
      const q = this.questions.find(x => x.key === key);
      if (!q) return this.answers[key];
      // For position, need dynamic options
      let opts = q.options;
      if (key === 'position') opts = this.getPositionOptions();
      const opt = opts.find(o => o.value === this.answers[key]);
      return opt ? opt.label : this.answers[key];
    },

    getPositionOptions() {
      const sys = this.answers.system;
      const base = [
        { value: '综合岗', label: '综合管理岗', desc: '办公室、秘书科等' }
      ];
      if (sys === '公务员' || sys === '参公') {
        return [
          { value: '组织部', label: '组织/干部管理' },
          { value: '宣传部', label: '宣传/文化' },
          { value: '纪委监委', label: '纪委监委' },
          { value: '公安', label: '公安系统', desc: '派出所/刑侦/交警等' },
          { value: '法院检察院', label: '法院/检察院', desc: '法官助理/检察官助理/书记员等' },
          { value: '财政局', label: '财政/审计' },
          { value: '发改委', label: '发改/经济' },
          { value: '法治普法', label: '司法/法治/信访' },
          { value: '应急管理', label: '应急管理' },
          { value: '人社局', label: '人社/民政' },
          ...base
        ];
      }
      if (sys === '教育医疗') {
        return [
          { value: '教师', label: '教师', desc: '中小学/高校教师' },
          { value: '医护', label: '医护人员', desc: '医生/护士' },
          { value: '党务岗', label: '学校/医院党务岗' },
          ...base
        ];
      }
      if (sys === '国企银行') {
        return [
          { value: '管理岗', label: '管理岗', desc: '部门负责人/中层' },
          { value: '技术岗', label: '技术岗' },
          { value: '金融业务岗', label: '金融/业务岗' },
          { value: '党建岗', label: '党建/纪检' },
          ...base
        ];
      }
      if (sys === '乡镇街道') {
        return [
          { value: '社区管理', label: '社区/村镇管理' },
          { value: '社会事务岗', label: '社会事务/民政' },
          { value: '党建岗', label: '党建/组织' },
          ...base
        ];
      }
      // 事业编：区分管理岗和专技岗
      if (sys === '事业编') {
        return [
          { value: '管理岗', label: '管理岗', desc: '走职务晋升路线' },
          { value: '专技岗', label: '专技岗', desc: '走职称评审路线' },
          { value: '党务岗', label: '党务/行政' },
          { value: '财政局', label: '财务/审计' },
          ...base
        ];
      }
      return [
        { value: '党务岗', label: '党务/行政' },
        { value: '人社局', label: '人事管理' },
        { value: '财政局', label: '财务/审计' },
        ...base
      ];
    },

    scrollToQuestion(idx) {
      this.$nextTick(() => {
        const ref = this.$refs['q' + idx];
        if (ref) {
          const el = Array.isArray(ref) ? ref[0] : ref;
          if (el && el.$el) {
            el.$el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    },

    jumpTo(idx) {
      this.currentStep = idx;
      this.inlineWarning = '';
      this.scrollToQuestion(idx);
    },

    async selectOption(key, value) {
      this.answers[key] = value;
      this.inlineWarning = '';

      // 大专学历：硬性阻断
      if (key === 'education' && value === '大专') {
        if (this.uuid && !this.uuid.startsWith('local-')) {
          fetch('/api/answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: this.uuid, question_key: key, answer_value: value })
          }).catch(() => {});
        }
        this.result = this.blockedByEducation();
        this.stage = 'result';
        this.$nextTick(() => {
          if (this.$refs.resultSection) {
            this.$refs.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        return;
      }

      // 即时提示
      if (key === 'party_member' && value === '否' && this.answers.region === '四川') {
        this.inlineWarning = '四川党校需要党员身份，但在川工作满2年、本科学历可报考重庆党校（不要求党员）';
      }

      // 保存答案到后端
      if (this.uuid && !this.uuid.startsWith('local-')) {
        fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: this.uuid, question_key: key, answer_value: value })
        }).catch(() => {});
      }

      // 跳下一题或出结果
      const delay = this.inlineWarning ? 1200 : 500;
      setTimeout(() => {
        if (this.currentStep < this.totalSteps - 1) {
          this.currentStep++;
          this.inlineWarning = '';
          this.scrollToQuestion(this.currentStep);
        } else {
          this.showResult();
        }
      }, delay);
    },

    async showResult() {
      this.isLoading = true;
      const texts = [
        '正在分析你的情况...',
        '匹配院校信息中...',
        '查找相似案例...',
        '生成诊断报告...'
      ];
      let i = 0;
      const timer = setInterval(() => {
        i++;
        if (i < texts.length) this.loadingText = texts[i];
      }, 700);

      try {
        const res = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: this.uuid })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        this.result = data;
      } catch (e) {
        this.result = this.localFallback();
      }

      clearInterval(timer);
      this.isLoading = false;

      // 根据用户情况筛选政策提示
      this.filterPolicies();

      this.stage = 'result';
      this.$nextTick(() => {
        setTimeout(() => {
          if (this.$refs.resultSection) {
            this.$refs.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      });
    },

    filterPolicies() {
      // 根据用户画像突出最相关的政策
      const all = [
        {
          title: '延迟退休稳妥实施',
          text: '职业后半段拉长，37-42岁读研依然划算，投资回报期20+年。35岁读研还有25年用，40岁也不晚。',
          match: ['36-40岁', '41岁以上']
        },
        {
          title: '"投资于人"写进政府报告',
          text: '受教育年限提升到11.7年，学历通胀加速，本科在体制内正在贬值。不管选什么，早读比晚读好——门槛只会更高。',
          match: ['all']
        },
        {
          title: '成渝双城经济圈提升能级',
          text: '跨区域竞争和流动加速，选成渝两地都认的学校（川大/重大）更有战略价值。四川人报重庆党校也是这个趋势的体现。',
          match: ['all']
        },
        {
          title: '事业单位深化改革',
          text: '"铁饭碗"正被重新定义。47家央企已降本增效，人均薪资降5-12%。学历和职称是不确定时代最确定的筹码。',
          match: ['事业编', '教育医疗', '国企银行']
        },
        {
          title: '基层减负+继续教育',
          text: '政策鼓励在职学习，单位普遍支持。现在读的阻力最小，领导不会为难你。服务期内也能读党校。',
          match: ['乡镇街道']
        },
        {
          title: '遴选年龄放宽信号',
          text: '科员级遴选年龄限制38岁，副科级43岁，处级46岁。延退背景下，年龄限制有继续放宽趋势。',
          match: ['遴选']
        }
      ];

      const age = this.answers.age;
      const sys = this.answers.system;
      const goal = this.answers.goal;

      this.policyNotes = all.filter(p => {
        if (p.match.includes('all')) return true;
        if (p.match.includes(age)) return true;
        if (p.match.includes(sys)) return true;
        if (p.match.includes(goal)) return true;
        return false;
      });
    },

    localFallback() {
      return {
        primary: { school: '数据加载失败', major: '', fee: '', reason: '请刷新页面重试，或直接联系顾问获取诊断。' },
        alternative: null, warnings: [], extraInfo: '', keyInfo: {}, case: null
      };
    },

    blockedByEducation() {
      return {
        primary: {
          school: '暂不符合报考条件',
          major: '需先提升至本科学历',
          fee: '',
          reason: '四川党校要求本科学历（学信网可查），重庆党校同样要求本科。MPA报考需本科毕业满3年或大专毕业满5年。建议先通过成人高考、自考或国家开放大学取得本科学历，再报考在职研究生。'
        },
        alternative: {
          school: '本科学历提升路径',
          major: '成人高考 / 自考 / 国家开放大学',
          fee: '约5000-8000元',
          reason: '成人高考最稳（2.5年毕业），自考最快（1.5-2年，需自学能力强），国开最省心（免试入学）。拿到本科毕业证后即可报考党校在职研究生。'
        },
        warnings: [{
          type: 'block_edu',
          text: '大专学历目前无法直接报考川渝党校在职研究生或MPA。这不是终点，先拿本科是最优路径。'
        }],
        extraInfo: '',
        keyInfo: {
          deadline: '本科学历提升随时可报名，建议尽早启动',
          examType: '成人高考每年10月考试，次年3月入学',
          passRate: ''
        },
        case: null
      };
    },

    async submitLead() {
      if (!this.leadForm.wechat && !this.leadForm.phone) return;
      this.submitting = true;
      try {
        await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uuid: this.uuid,
            wechat_id: this.leadForm.wechat,
            phone: this.leadForm.phone
          })
        });
        this.leadSuccess = true;
      } catch (e) {}
      this.submitting = false;
    }
  }
}).mount('#app');
