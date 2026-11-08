
/* 模拟浏览器 DOM：fetch 返回录制的真实 API 数据；Chart.js 不 mock（复现 CDN 失败场景） */
function el(id){ const e={innerHTML:'',textContent:'',style:{},value:'',files:[],dataset:{},
  children:[],disabled:false,
  classList:{add(){},remove(){},toggle(){},contains:()=>false},
  addEventListener(){},removeEventListener(){},setAttribute(){},getAttribute:null,
  appendChild(){},querySelector:()=>null,querySelectorAll:()=>[],
  focus(){},blur(){},click(){}};
  Object.defineProperty(e,'checked',{get:()=>false});
  POOL[id]=e; return e; }
const POOL={};
const document={getElementById:id=>POOL[id]||el(id),querySelector:()=>el('q'),querySelectorAll:()=>[],
  createElement:t=>el('new_'+t+Math.random()),addEventListener(){},body:el('body'),head:el('head')};
const localStorage={getItem:()=>null,setItem(){},removeItem(){}};
const location={hash:'',replaceState(){}},history={replaceState(){}};
const window={open(){},addEventListener(){},location};
const navigator={};
const REAL={"/api/reports/subjects|/api/reports/subjects":{"items": [{"subject_code": "1001", "subject_name": "库存现金", "category": "资产", "debit": 238.5, "credit": 2400.0}, {"subject_code": "1002", "subject_name": "银行存款", "category": "资产", "debit": 129500.0, "credit": 29460.0}, {"subject_code": "1122", "subject_name": "应收账款", "category": "资产", "debit": 0.0, "credit": 55000.0}, {"subject_code": "1221", "subject_name": "其他应收款", "category": "资产", "debit": 2000.0, "credit": 1688.5}, {"subject_code": "1601", "subject_name": "固定资产", "category": "资产", "debit": 8000.0, "credit": 0.0}, {"subject_code": "1602", "subject_name": "累计折旧", "category": "资产", "debit": 0.0, "credit": 211.11}, {"subject_code": "2202", "subject_name": "应付账款", "category": "负债", "debit": 0.0, "credit": 1130.0}, {"subject_code": "2221", "subject_name": "应交税费", "category": "负债", "debit": 930.0, "credit": 0.0}, {"subject_code": "4103", "subject_name": "本年利润", "category": "权益", "debit": 2471.11, "credit": 0.0}, {"subject_code": "6001", "subject_name": "主营业务收入", "category": "损益", "debit": 0.0, "credit": 74500.0}, {"subject_code": "6602", "subject_name": "管理费用", "category": "损益", "debit": 24571.11, "credit": 3321.11}, {"subject_code": "6603", "subject_name": "财务费用", "category": "损益", "debit": 0.0, "credit": 0.0}]},"/api/audit|/api/audit":{"items": [{"id": 114, "at": "2026-11-08T14:55:28", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.95 MB（含运行时）", "prev_hash": "7a674b779b2c5e2ca5c953104cc69829a3c3358e3bdcf336e4223ff29bc9b434", "hash": "bd40702221a716c7b3776ec3ef66c2eb42379918ba2ad700935465d46f3f57ef"}, {"id": 113, "at": "2026-11-08T11:46:55", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.94 MB（含运行时）", "prev_hash": "95131eb9a178950ae9b2a1a54bd0a003dc4a86cc2fe13595e0de7db052c6b475", "hash": "7a674b779b2c5e2ca5c953104cc69829a3c3358e3bdcf336e4223ff29bc9b434"}, {"id": 112, "at": "2026-11-08T11:37:17", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.94 MB（含运行时）", "prev_hash": "c385d55af6cd5ce6c68f779c13ca61f276cb055d658a905ee3436ab3bbf66c1a", "hash": "95131eb9a178950ae9b2a1a54bd0a003dc4a86cc2fe13595e0de7db052c6b475"}, {"id": 111, "at": "2026-11-08T10:53:28", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.94 MB（含运行时）", "prev_hash": "1d0a0fc11dbc7490bb6f6b9066cf142193aeb4228a9cb1693e8fa007dee5840f", "hash": "c385d55af6cd5ce6c68f779c13ca61f276cb055d658a905ee3436ab3bbf66c1a"}, {"id": 110, "at": "2026-11-08T10:40:10", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.87 MB（含运行时）", "prev_hash": "5c01959dd0979e03bd0353739150e946d70b7ddc14a2d34cd070d5316a65b188", "hash": "1d0a0fc11dbc7490bb6f6b9066cf142193aeb4228a9cb1693e8fa007dee5840f"}, {"id": 109, "at": "2026-11-08T10:21:37", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.84 MB（含运行时）", "prev_hash": "8cda0e85f47cda31d409e28befa4e0d022a011c2950a6bc749b5acba929792e6", "hash": "5c01959dd0979e03bd0353739150e946d70b7ddc14a2d34cd070d5316a65b188"}, {"id": 108, "at": "2026-11-08T10:03:36", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.79 MB（含运行时）", "prev_hash": "27000a216a95d702d39730c813ef5dedbb9fc58cd344df46a7b1f5bf913a4abd", "hash": "8cda0e85f47cda31d409e28befa4e0d022a011c2950a6bc749b5acba929792e6"}, {"id": 107, "at": "2026-11-07T23:59:26", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.76 MB（含运行时）", "prev_hash": "8a3b01a4a0025c2f3158ac57fdf385847d0db9d7fc4c8300e1b86045daf7f9ae", "hash": "27000a216a95d702d39730c813ef5dedbb9fc58cd344df46a7b1f5bf913a4abd"}, {"id": 106, "at": "2026-11-07T23:21:35", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.75 MB（含运行时）", "prev_hash": "ae4a24eeff38e3f420dbdc20c2f3453d24b6e9a28f28d04ee599b51e65534d2d", "hash": "8a3b01a4a0025c2f3158ac57fdf385847d0db9d7fc4c8300e1b86045daf7f9ae"}, {"id": 105, "at": "2026-11-07T14:52:24", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.74 MB（含运行时）", "prev_hash": "6638f867c6b85e666c97feb023bb95e8cbeeae2a892dcde54e490caaa9151110", "hash": "ae4a24eeff38e3f420dbdc20c2f3453d24b6e9a28f28d04ee599b51e65534d2d"}, {"id": 104, "at": "2026-11-07T14:01:55", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.74 MB（含运行时）", "prev_hash": "03a453e2edfde052fbae9db12c3d5018d50fa151ad7a4c7cb897cb5f8f7c3f1c", "hash": "6638f867c6b85e666c97feb023bb95e8cbeeae2a892dcde54e490caaa9151110"}, {"id": 103, "at": "2026-11-07T13:59:02", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.73 MB（含运行时）", "prev_hash": "6fa77292e2ef853b93a456d71f7a7e878f2f64d167985b8468e784f8acf75257", "hash": "03a453e2edfde052fbae9db12c3d5018d50fa151ad7a4c7cb897cb5f8f7c3f1c"}, {"id": 102, "at": "2026-11-07T13:57:56", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.73 MB（含运行时）", "prev_hash": "68db86d9bd3543e5b0ac046d648f8d331cad08360fdb0017523359e2bb28b7ee", "hash": "6fa77292e2ef853b93a456d71f7a7e878f2f64d167985b8468e784f8acf75257"}, {"id": 101, "at": "2026-11-07T13:56:29", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.73 MB（含运行时）", "prev_hash": "b8f121df155de8538ff6af33b5b8c7ebfa4521a6238f5bac9dfeb9c09ec2aea3", "hash": "68db86d9bd3543e5b0ac046d648f8d331cad08360fdb0017523359e2bb28b7ee"}, {"id": 100, "at": "2026-11-07T13:35:00", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.73 MB（含运行时）", "prev_hash": "2dfb9917ecdbb551b69e80f7ce5ccb2d413fbfa0b58071ce1cc649bce107120e", "hash": "b8f121df155de8538ff6af33b5b8c7ebfa4521a6238f5bac9dfeb9c09ec2aea3"}, {"id": 99, "at": "2026-11-07T13:17:21", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.71 MB（含运行时）", "prev_hash": "a086e31a7b3d517712148182941b9e0ce2750df46a770e97efc8f6655656d508", "hash": "2dfb9917ecdbb551b69e80f7ce5ccb2d413fbfa0b58071ce1cc649bce107120e"}, {"id": 98, "at": "2026-11-07T13:16:26", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.71 MB（含运行时）", "prev_hash": "51bb95392558da2671fb0b336571e34a94dcbccae48d7fe47847cf47007884cf", "hash": "a086e31a7b3d517712148182941b9e0ce2750df46a770e97efc8f6655656d508"}, {"id": 97, "at": "2026-11-07T13:05:55", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.70 MB（含运行时）", "prev_hash": "240a7734e4963bbace5a9a105e21a9f7b01ab714881352bd7d870718d6bbede0", "hash": "51bb95392558da2671fb0b336571e34a94dcbccae48d7fe47847cf47007884cf"}, {"id": 96, "at": "2026-11-07T12:54:52", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.70 MB（含运行时）", "prev_hash": "dd02e9893190ee992a12d0e0f4533029da3a5a6dc62431b13710d9ae55b5c97c", "hash": "240a7734e4963bbace5a9a105e21a9f7b01ab714881352bd7d870718d6bbede0"}, {"id": 95, "at": "2026-11-07T12:07:24", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.66 MB（含运行时）", "prev_hash": "0806319cbc63df33c20bcb77f4d2db8e547e53344e2cd070e80c139c5de8f023", "hash": "dd02e9893190ee992a12d0e0f4533029da3a5a6dc62431b13710d9ae55b5c97c"}, {"id": 94, "at": "2026-11-07T12:06:51", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.66 MB（含运行时）", "prev_hash": "eef7dc45755894b2b717e317da6d49fddeaeaca3ed026a0fe1d562de650cfeb7", "hash": "0806319cbc63df33c20bcb77f4d2db8e547e53344e2cd070e80c139c5de8f023"}, {"id": 93, "at": "2026-11-07T12:05:12", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.66 MB（含运行时）", "prev_hash": "026764848ab81a0e62cce4d2ddb23f2260ec2daaf57a413b86dac7419a4c280f", "hash": "eef7dc45755894b2b717e317da6d49fddeaeaca3ed026a0fe1d562de650cfeb7"}, {"id": 92, "at": "2026-11-07T11:39:19", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.64 MB（含运行时）", "prev_hash": "504671d87bf3a16feb1f7358ab04880b0e448508df6d85178b9ce7fa792d25a8", "hash": "026764848ab81a0e62cce4d2ddb23f2260ec2daaf57a413b86dac7419a4c280f"}, {"id": 91, "at": "2026-11-07T11:07:38", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.61 MB（含运行时）", "prev_hash": "3c0d46e415002072f1c1d90375ee2c869a50066b8abc402a9f3f8e6714133d5e", "hash": "504671d87bf3a16feb1f7358ab04880b0e448508df6d85178b9ce7fa792d25a8"}, {"id": 90, "at": "2026-11-07T11:06:51", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.61 MB（含运行时）", "prev_hash": "db2734df7f1252f096f77171ae20e88563e66d049add79a14d32e6e0afcfef1b", "hash": "3c0d46e415002072f1c1d90375ee2c869a50066b8abc402a9f3f8e6714133d5e"}, {"id": 89, "at": "2026-11-07T11:05:14", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.60 MB（含运行时）", "prev_hash": "68f35ce0df042c344007f344e3f0bafec487e6000d4dccde8a9220e6176306d3", "hash": "db2734df7f1252f096f77171ae20e88563e66d049add79a14d32e6e0afcfef1b"}, {"id": 88, "at": "2026-11-07T11:02:38", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.60 MB（含运行时）", "prev_hash": "89e1733fe7b4884515f8566180d74ad2197263357a46d6c1d3a38be959ee44b1", "hash": "68f35ce0df042c344007f344e3f0bafec487e6000d4dccde8a9220e6176306d3"}, {"id": 87, "at": "2026-11-06T23:12:07", "actor": "出纳", "action": "对账标记", "entity": "journal", "entity_id": "10", "detail": "已调节", "prev_hash": "2ce58cdf02ac94d7fb5cc110614a95465c8f1b5125dd7db40f14f39184e834a6", "hash": "89e1733fe7b4884515f8566180d74ad2197263357a46d6c1d3a38be959ee44b1"}, {"id": 86, "at": "2026-11-06T23:12:06", "actor": "出纳", "action": "对账标记", "entity": "journal", "entity_id": "9", "detail": "已核对", "prev_hash": "d49df7ce1f6d4f9cd4e4a2c37feeb43615e16d3eee317be5c921fb395a8fe0b3", "hash": "2ce58cdf02ac94d7fb5cc110614a95465c8f1b5125dd7db40f14f39184e834a6"}, {"id": 85, "at": "2026-11-06T23:11:39", "actor": "出纳", "action": "日结盘点", "entity": "daily_check", "entity_id": "2026-11-06", "detail": "cash 实存 5000.01", "prev_hash": "ea1deeddd2afab4629547cce6699ef6af47b895d5c7464fc1e2b780123a099e9", "hash": "d49df7ce1f6d4f9cd4e4a2c37feeb43615e16d3eee317be5c921fb395a8fe0b3"}, {"id": 84, "at": "2026-11-06T23:11:39", "actor": "出纳", "action": "日结盘点", "entity": "daily_check", "entity_id": "2026-11-06", "detail": "cash 实存 5000.01", "prev_hash": "ccde2a87d702924dbcdb0463c21b4c67231c47dca6d9e4445dc7f016dd7d4468", "hash": "ea1deeddd2afab4629547cce6699ef6af47b895d5c7464fc1e2b780123a099e9"}, {"id": 83, "at": "2026-11-06T23:11:38", "actor": "出纳", "action": "日结盘点", "entity": "daily_check", "entity_id": "2026-11-06", "detail": "cash 实存 4999.99", "prev_hash": "73bbf8d41ffb0c2c10c46983c0e08ec0615264d6fe9fab1a47c74df9e6e257f2", "hash": "ccde2a87d702924dbcdb0463c21b4c67231c47dca6d9e4445dc7f016dd7d4468"}, {"id": 82, "at": "2026-11-06T23:11:38", "actor": "出纳", "action": "日结盘点", "entity": "daily_check", "entity_id": "2026-11-06", "detail": "cash 实存 4999.99", "prev_hash": "78411f56bbf4f7e55c413b5740907b9bd1bcb2414e1e97bf874096e20f71e495", "hash": "73bbf8d41ffb0c2c10c46983c0e08ec0615264d6fe9fab1a47c74df9e6e257f2"}, {"id": 81, "at": "2026-11-06T23:11:36", "actor": "出纳", "action": "日结盘点", "entity": "daily_check", "entity_id": "2026-11-06", "detail": "cash 实存 5000.01", "prev_hash": "a07d0426afed09ef675b0e3182a13baccbfbb3d017b646d93f9f51f01ee918af", "hash": "78411f56bbf4f7e55c413b5740907b9bd1bcb2414e1e97bf874096e20f71e495"}, {"id": 80, "at": "2026-11-06T23:10:37", "actor": "出纳", "action": "反结账", "entity": "period", "entity_id": "2026-11", "detail": "2026-11 已反结账", "prev_hash": "e5d52e7c7511db6611f7b907b92a01becda4a74d2724b6fb1e5bad31cbcab581", "hash": "a07d0426afed09ef675b0e3182a13baccbfbb3d017b646d93f9f51f01ee918af"}, {"id": 79, "at": "2026-11-06T23:10:35", "actor": "出纳", "action": "月末结账", "entity": "period", "entity_id": "2026-11", "detail": "2026-11 已结账", "prev_hash": "24492542916ca85fad97fa8607b8d66d0b8e15cada1c8320b54e89a83c8aa0ba", "hash": "e5d52e7c7511db6611f7b907b92a01becda4a74d2724b6fb1e5bad31cbcab581"}, {"id": 78, "at": "2026-11-06T22:57:11", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.57 MB（含运行时）", "prev_hash": "196fa1e81276c0d588513562c364628965e8dc66172190fe975078d77bfc0403", "hash": "24492542916ca85fad97fa8607b8d66d0b8e15cada1c8320b54e89a83c8aa0ba"}, {"id": 77, "at": "2026-11-06T20:50:30", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.55 MB（含运行时）", "prev_hash": "6b19c17356560ede57a1bd32012c8d0ed245054eda8bf09e31ce1961bb95e1de", "hash": "196fa1e81276c0d588513562c364628965e8dc66172190fe975078d77bfc0403"}, {"id": 76, "at": "2026-11-06T20:44:03", "actor": "会计", "action": "固定资产入账", "entity": "asset", "entity_id": "1", "detail": "FA202611001 原值 8000.00", "prev_hash": "128e8d552daf931e9346124da2cbd1f7230b18c802f16b939f9147e285e4ae06", "hash": "6b19c17356560ede57a1bd32012c8d0ed245054eda8bf09e31ce1961bb95e1de"}, {"id": 75, "at": "2026-11-06T20:44:03", "actor": "会计", "action": "凭证过账", "entity": "voucher", "entity_id": "16", "detail": "记-202611012 已登记日记账", "prev_hash": "5451282e1e54b16c9f3543716571a45f81c1cfdce51e94927ac3d48c573a1af6", "hash": "128e8d552daf931e9346124da2cbd1f7230b18c802f16b939f9147e285e4ae06"}, {"id": 74, "at": "2026-11-06T20:44:03", "actor": "会计", "action": "新增凭证", "entity": "voucher", "entity_id": "16", "detail": "记-202611012 借贷各 8000.00", "prev_hash": "0b9e137f1c56ecc2aa9c3581525cd66a2e2431da3f7c0d16f50d29aaba9ca414", "hash": "5451282e1e54b16c9f3543716571a45f81c1cfdce51e94927ac3d48c573a1af6"}, {"id": 73, "at": "2026-11-06T20:21:41", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.53 MB（含运行时）", "prev_hash": "c32954547974619128bc628877e42a08b494ae3bd025fb980a696e09c2358cf6", "hash": "0b9e137f1c56ecc2aa9c3581525cd66a2e2431da3f7c0d16f50d29aaba9ca414"}, {"id": 72, "at": "2026-11-06T20:16:23", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "10.52 MB（含运行时）", "prev_hash": "01d06333c1f539d61de07b5ce857b913302d9f18265e2ad351088f20dd7eb369", "hash": "c32954547974619128bc628877e42a08b494ae3bd025fb980a696e09c2358cf6"}, {"id": 71, "at": "2026-11-06T20:06:36", "actor": "系统", "action": "导出整站迁移包", "entity": "system", "entity_id": "", "detail": "0.12 MB", "prev_hash": "82e286549478ced515381598f9be06b070cac981eb4a52a63d53db9addf06e25", "hash": "01d06333c1f539d61de07b5ce857b913302d9f18265e2ad351088f20dd7eb369"}, {"id": 70, "at": "2026-11-06T20:05:42", "actor": "会计主管", "action": "结转损益", "entity": "period", "entity_id": "2026-11", "detail": "结转凭证 15，净额 2471.11", "prev_hash": "f243d882134dcc39e2c25ffb98b98cd949e9aa7e8545e781ef1cb21eafd16b87", "hash": "82e286549478ced515381598f9be06b070cac981eb4a52a63d53db9addf06e25"}, {"id": 69, "at": "2026-11-06T20:05:42", "actor": "会计主管", "action": "凭证过账", "entity": "voucher", "entity_id": "15", "detail": "记-202611011 已登记日记账", "prev_hash": "82f852dd2af345fc6b73464cffd328ffd4dc07c9763a1b3d685eb0f2e2d45474", "hash": "f243d882134dcc39e2c25ffb98b98cd949e9aa7e8545e781ef1cb21eafd16b87"}, {"id": 68, "at": "2026-11-06T20:05:42", "actor": "会计主管", "action": "新增凭证", "entity": "voucher", "entity_id": "15", "detail": "记-202611011 借贷各 2471.11", "prev_hash": "3cc75f7e6bd8a771b4b2f88a4f23450a39b229a4515a2a8370551405a8ae6a3e", "hash": "82f852dd2af345fc6b73464cffd328ffd4dc07c9763a1b3d685eb0f2e2d45474"}, {"id": 67, "at": "2026-11-06T20:05:42", "actor": "会计", "action": "计提折旧", "entity": "asset", "entity_id": "", "detail": "2026-11 共 1 项，合计 211.11", "prev_hash": "7133f2b5405322f2714acdd2ae5a2a7893a4ad91bbb23ef53854a42be9ca6cc7", "hash": "3cc75f7e6bd8a771b4b2f88a4f23450a39b229a4515a2a8370551405a8ae6a3e"}, {"id": 66, "at": "2026-11-06T20:05:42", "actor": "会计", "action": "凭证过账", "entity": "voucher", "entity_id": "14", "detail": "记-202611010 已登记日记账", "prev_hash": "c4f11b8454eae4f1de41873f205292f082f3fb5534acf40d8769987b3a437b94", "hash": "7133f2b5405322f2714acdd2ae5a2a7893a4ad91bbb23ef53854a42be9ca6cc7"}, {"id": 65, "at": "2026-11-06T20:05:42", "actor": "会计", "action": "新增凭证", "entity": "voucher", "entity_id": "14", "detail": "记-202611010 借贷各 211.11", "prev_hash": "d3bcedde848dcda51e785265069c19a4a86405a416d039cb696c0baefdf08746", "hash": "c4f11b8454eae4f1de41873f205292f082f3fb5534acf40d8769987b3a437b94"}, {"id": 64, "at": "2026-11-06T20:05:00", "actor": "测试", "action": "导入整站迁移包", "entity": "system", "entity_id": "", "detail": "表 22 张，附件 0 个", "prev_hash": "aadea428e241fc2d5796e99f2ec1cdcadf8ddc2311b7a63d33185e78780e5ced", "hash": "d3bcedde848dcda51e785265069c19a4a86405a416d039cb696c0baefdf08746"}, {"id": 62, "at": "2026-11-06T20:05:00", "actor": "会计", "action": "期初建账", "entity": "opening", "entity_id": "2026-11", "detail": "3 个科目，借贷各 91,000.00", "prev_hash": "5bc6de0d955090749ae25d9b48afb7d59d45649d8b0e7a3ba26c999dda9afbf5", "hash": "aadea428e241fc2d5796e99f2ec1cdcadf8ddc2311b7a63d33185e78780e5ced"}, {"id": 61, "at": "2026-11-06T20:05:00", "actor": "会计", "action": "新增固定资产", "entity": "asset", "entity_id": "1", "detail": "FA202611001 笔记本电脑 原值 8000", "prev_hash": "2fed668d52e58ce70d434957710a2ae0da1866311b0fc334d07cf451ca460e8d", "hash": "5bc6de0d955090749ae25d9b48afb7d59d45649d8b0e7a3ba26c999dda9afbf5"}, {"id": 60, "at": "2026-11-06T19:53:43", "actor": "会计主管", "action": "红字冲销", "entity": "voucher", "entity_id": "12", "detail": "记-202611009 → 记-202611009-冲，原因：测试冲销", "prev_hash": "9ee61b0f10f91c2d28ed83617272844868f78a172aa08584847a5526e02500a7", "hash": "2fed668d52e58ce70d434957710a2ae0da1866311b0fc334d07cf451ca460e8d"}, {"id": 59, "at": "2026-11-06T19:53:43", "actor": "会计主管", "action": "凭证过账", "entity": "voucher", "entity_id": "13", "detail": "记-202611009-冲 已登记日记账", "prev_hash": "70d075b05e85707e010010a9791ee3a26a531861a06d61d4f9af44c18170f3a1", "hash": "9ee61b0f10f91c2d28ed83617272844868f78a172aa08584847a5526e02500a7"}, {"id": 58, "at": "2026-11-06T19:53:43", "actor": "会计主管", "action": "新增凭证", "entity": "voucher", "entity_id": "13", "detail": "记-202611009-冲 借贷各 50.00", "prev_hash": "6442858758b6ca04c012a3743da1750a062e5eb3edcefabfd96a715911cf65f6", "hash": "70d075b05e85707e010010a9791ee3a26a531861a06d61d4f9af44c18170f3a1"}, {"id": 57, "at": "2026-11-06T19:53:43", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "12", "detail": "记-202611009 已登记日记账", "prev_hash": "b83dac8426e9e0c447d2f83c32cb819af95920b508052b3d556fc3244e62a5e9", "hash": "6442858758b6ca04c012a3743da1750a062e5eb3edcefabfd96a715911cf65f6"}, {"id": 56, "at": "2026-11-06T19:53:43", "actor": "会计主管", "action": "审核通过", "entity": "voucher", "entity_id": "12", "detail": "记-202611009", "prev_hash": "59b2f311d2f364361535bd960e8223a3445a969fdc45a60b8862a8a2af4e241c", "hash": "b83dac8426e9e0c447d2f83c32cb819af95920b508052b3d556fc3244e62a5e9"}, {"id": 55, "at": "2026-11-06T19:53:43", "actor": "小王", "action": "提交审核", "entity": "voucher", "entity_id": "12", "detail": "记-202611009", "prev_hash": "fd418441a740c4d8d3a1984e928198a1c07f3759455202fe8005e5628f824f6b", "hash": "59b2f311d2f364361535bd960e8223a3445a969fdc45a60b8862a8a2af4e241c"}, {"id": 54, "at": "2026-11-06T19:53:43", "actor": "小王", "action": "新增凭证", "entity": "voucher", "entity_id": "12", "detail": "记-202611009 借贷各 50.00", "prev_hash": "cbc211648c5eec018a3df70143502f84f2eacf9825772eaa0f0b63b848b579ff", "hash": "fd418441a740c4d8d3a1984e928198a1c07f3759455202fe8005e5628f824f6b"}, {"id": 53, "at": "2026-11-06T19:53:43", "actor": "会计主管", "action": "设置预算", "entity": "budget", "entity_id": "2026-11", "detail": "6602 ¥5,000.00", "prev_hash": "5d0483d5672c8d8c8f6bbc727165dc51319270a7a07f86219b500d75c4a18c10", "hash": "cbc211648c5eec018a3df70143502f84f2eacf9825772eaa0f0b63b848b579ff"}, {"id": 52, "at": "2026-11-06T19:53:43", "actor": "会计", "action": "发票生成凭证", "entity": "invoice", "entity_id": "1", "detail": "FP202611001 → 凭证 11", "prev_hash": "c2be66ad7bfdbbe556a563750469633c67914053b1af66e2ff696253ee22388e", "hash": "5d0483d5672c8d8c8f6bbc727165dc51319270a7a07f86219b500d75c4a18c10"}, {"id": 51, "at": "2026-11-06T19:53:43", "actor": "会计", "action": "凭证过账", "entity": "voucher", "entity_id": "11", "detail": "记-202611008 已登记日记账", "prev_hash": "5756c86d020de8b58107444f3fc5a7748c0d26cfa9f36ebf4f412a6cfb266065", "hash": "c2be66ad7bfdbbe556a563750469633c67914053b1af66e2ff696253ee22388e"}, {"id": 50, "at": "2026-11-06T19:53:43", "actor": "会计", "action": "新增凭证", "entity": "voucher", "entity_id": "11", "detail": "记-202611008 借贷各 1130.00", "prev_hash": "617dc0a8fedde4684cdf81262b79de06e31d0bbf949c00ec8500f8798b2de864", "hash": "5756c86d020de8b58107444f3fc5a7748c0d26cfa9f36ebf4f412a6cfb266065"}, {"id": 49, "at": "2026-11-06T19:53:42", "actor": "系统", "action": "登记发票", "entity": "invoice", "entity_id": "1", "detail": "进项 FP202611001 ¥1130.00", "prev_hash": "67d1cccc25e516ed62dfb7742447955fee8dbbbaa4d6f27bc4cec5ea3e0ff894", "hash": "617dc0a8fedde4684cdf81262b79de06e31d0bbf949c00ec8500f8798b2de864"}, {"id": 48, "at": "2026-11-06T19:43:11", "actor": "测试", "action": "登记文档", "entity": "attachment", "entity_id": "1", "detail": "测试财务报告.docx（Word 文档）", "prev_hash": "a7ebf3dace31d8e4f8908a5d6255de6c248091a194a0203ff0e0c3c55ccb62b4", "hash": "67d1cccc25e516ed62dfb7742447955fee8dbbbaa4d6f27bc4cec5ea3e0ff894"}, {"id": 47, "at": "2026-11-06T19:43:11", "actor": "测试", "action": "Excel 导入", "entity": "import", "entity_id": "journal", "detail": "成功 2 行 / 失败 0 行", "prev_hash": "d5647d2c45e5dcbe392dceecd29ed59afa397cb9e379b0c37292ea1abe200eba", "hash": "a7ebf3dace31d8e4f8908a5d6255de6c248091a194a0203ff0e0c3c55ccb62b4"}, {"id": 46, "at": "2026-11-06T19:43:11", "actor": "测试", "action": "凭证过账", "entity": "voucher", "entity_id": "10", "detail": "记-202611007 已登记日记账", "prev_hash": "8cb378eb04e307c0ba1b488656a40f235c2bacc7e3778f35cfdd60b680da67f4", "hash": "d5647d2c45e5dcbe392dceecd29ed59afa397cb9e379b0c37292ea1abe200eba"}, {"id": 45, "at": "2026-11-06T19:43:11", "actor": "测试", "action": "新增凭证", "entity": "voucher", "entity_id": "10", "detail": "记-202611007 借贷各 260.00", "prev_hash": "cc959b180468560978dd3eb5f8fa02f1c1167c0df4126aa7b32192ad0e061bbf", "hash": "8cb378eb04e307c0ba1b488656a40f235c2bacc7e3778f35cfdd60b680da67f4"}, {"id": 44, "at": "2026-11-06T19:43:11", "actor": "测试", "action": "凭证过账", "entity": "voucher", "entity_id": "9", "detail": "记-202611006 已登记日记账", "prev_hash": "72c63215c5d369d8db51c27e5c5b59348e8d4c4a3c18cc5bfd37077e310a6ba5", "hash": "cc959b180468560978dd3eb5f8fa02f1c1167c0df4126aa7b32192ad0e061bbf"}, {"id": 43, "at": "2026-11-06T19:43:11", "actor": "测试", "action": "新增凭证", "entity": "voucher", "entity_id": "9", "detail": "记-202611006 借贷各 188.50", "prev_hash": "281915ea701a6ce55c3e4853f7b99399f10084c9d567c873370e470836064091", "hash": "72c63215c5d369d8db51c27e5c5b59348e8d4c4a3c18cc5bfd37077e310a6ba5"}, {"id": 42, "at": "2026-11-06T19:32:59", "actor": "系统", "action": "恢复备份", "entity": "system", "entity_id": null, "detail": "导入 113 行", "prev_hash": "2b2cfb2bf8f3c007c9b89ba5e2c5ec9ff501f9042b46331ea566dd61e6ee25f9", "hash": "281915ea701a6ce55c3e4853f7b99399f10084c9d567c873370e470836064091"}, {"id": 41, "at": "2026-11-06T19:32:47", "actor": "系统", "action": "重算余额", "entity": "system", "entity_id": null, "detail": "参数变更后重算", "prev_hash": "3aac828efa8af541144cfa6dfecb886f9f263978b241815abdefeee3e5519754", "hash": "2b2cfb2bf8f3c007c9b89ba5e2c5ec9ff501f9042b46331ea566dd61e6ee25f9"}, {"id": 40, "at": "2026-11-06T19:27:44", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "8", "detail": "记-202610002 已登记日记账", "prev_hash": "3d3a8a2a27d3a19b9961131a1fb80cf6ac2de6b68618c9fea19f7b8de77926e8", "hash": "3aac828efa8af541144cfa6dfecb886f9f263978b241815abdefeee3e5519754"}, {"id": 39, "at": "2026-11-06T19:27:44", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "8", "detail": "记-202610002 借贷各 30000.00", "prev_hash": "d06ae2a2c7d103f76c85dd283da3d066f3e62b54cb5a3b477d6d4f0c547c0659", "hash": "3d3a8a2a27d3a19b9961131a1fb80cf6ac2de6b68618c9fea19f7b8de77926e8"}, {"id": 38, "at": "2026-11-06T19:27:44", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "7", "detail": "记-202610001 已登记日记账", "prev_hash": "bf5a528fb41c7d3f9644a5294fe389057bf3255c3fff651508b108d4fafff65b", "hash": "d06ae2a2c7d103f76c85dd283da3d066f3e62b54cb5a3b477d6d4f0c547c0659"}, {"id": 37, "at": "2026-11-06T19:27:44", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "7", "detail": "记-202610001 借贷各 9200.00", "prev_hash": "da332f9bd183aeb1b0c4490870236055f14a043dbf0f72d600b36bb2cba23fdc", "hash": "bf5a528fb41c7d3f9644a5294fe389057bf3255c3fff651508b108d4fafff65b"}, {"id": 36, "at": "2026-11-06T19:27:44", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "6", "detail": "记-202609001 已登记日记账", "prev_hash": "ce8019fc1d68c0ee330379ea2fa940c2d0267f72272e996a0bf8375bed2686f9", "hash": "da332f9bd183aeb1b0c4490870236055f14a043dbf0f72d600b36bb2cba23fdc"}, {"id": 35, "at": "2026-11-06T19:27:44", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "6", "detail": "记-202609001 借贷各 18000.00", "prev_hash": "6034d7ed322a2611b0241159475712f478417decbe4c399c37326234953516cb", "hash": "ce8019fc1d68c0ee330379ea2fa940c2d0267f72272e996a0bf8375bed2686f9"}, {"id": 34, "at": "2026-11-06T19:27:44", "actor": "会计主管", "action": "反结账", "entity": "period", "entity_id": "2026-11", "detail": "2026-11 已反结账", "prev_hash": "eb7ce7143612c4cd006aca6320b2fe9032d2cfcaacf13009e96c9573cdf982c3", "hash": "6034d7ed322a2611b0241159475712f478417decbe4c399c37326234953516cb"}, {"id": 33, "at": "2026-11-06T19:27:29", "actor": "会计主管", "action": "月末结账", "entity": "period", "entity_id": "2026-11", "detail": "2026-11 已结账", "prev_hash": "aaf2f2ae835f61f8ea2b0644bcfc3f5ab1f004f1ab5b6055f956549dff42945f", "hash": "eb7ce7143612c4cd006aca6320b2fe9032d2cfcaacf13009e96c9573cdf982c3"}, {"id": 32, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "自动勾对", "entity": "bank_statement", "entity_id": null, "detail": "匹配 1 笔", "prev_hash": "5102424075fb136aa504f46e825ae3cf19db1d125556b0650c155083cc106b12", "hash": "aaf2f2ae835f61f8ea2b0644bcfc3f5ab1f004f1ab5b6055f956549dff42945f"}, {"id": 31, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "导入对账单", "entity": "bank_statement", "entity_id": null, "detail": "1 条", "prev_hash": "2e25363cf921f684c13156a029680001118f649a8d646c300a19fccfb830ee5f", "hash": "5102424075fb136aa504f46e825ae3cf19db1d125556b0650c155083cc106b12"}, {"id": 30, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "日结盘点", "entity": "daily_check", "entity_id": "2026-11-06", "detail": "cash 实存 5000", "prev_hash": "89bbf6335c6968779396038170c1b347f4bd8070417c23334beca6980400428f", "hash": "2e25363cf921f684c13156a029680001118f649a8d646c300a19fccfb830ee5f"}, {"id": 29, "at": "2026-11-06T19:27:29", "actor": "会计", "action": "凭证过账", "entity": "voucher", "entity_id": "5", "detail": "记-202611005 已登记日记账", "prev_hash": "5eccbbe21f296c8c58dd2900d9b2161c4093d0243cfcfc05a53f9e9821163d1b", "hash": "89bbf6335c6968779396038170c1b347f4bd8070417c23334beca6980400428f"}, {"id": 28, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "审核通过", "entity": "voucher", "entity_id": "5", "detail": "记-202611005", "prev_hash": "920d89f07d31d2f9c17a7b80c2390431b5f432d8d0b97cae3c50840071349237", "hash": "5eccbbe21f296c8c58dd2900d9b2161c4093d0243cfcfc05a53f9e9821163d1b"}, {"id": 27, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "提交审核", "entity": "voucher", "entity_id": "5", "detail": "记-202611005", "prev_hash": "918202681ec0e3e3b6cfd098521f056daf27be61880c64c40b03b1511fc62253", "hash": "920d89f07d31d2f9c17a7b80c2390431b5f432d8d0b97cae3c50840071349237"}, {"id": 26, "at": "2026-11-06T19:27:29", "actor": "会计", "action": "新增凭证", "entity": "voucher", "entity_id": "5", "detail": "记-202611005 借贷各 800.00", "prev_hash": "c9c759799f4017d7e3ead065731ccd93925ca5f2a45fb99e83f7e27d8b5dd0ee", "hash": "918202681ec0e3e3b6cfd098521f056daf27be61880c64c40b03b1511fc62253"}, {"id": 25, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "单据结算", "entity": "doc", "entity_id": "4", "detail": "BX202611001 生成凭证 记-202611004", "prev_hash": "95b5c96f59dd566e4346f0dacbb6c17971c96fd445f89d4a42d441b593cff46d", "hash": "c9c759799f4017d7e3ead065731ccd93925ca5f2a45fb99e83f7e27d8b5dd0ee"}, {"id": 24, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "借款核销", "entity": "doc", "entity_id": "3", "detail": "由报销单 BX202611001 冲抵", "prev_hash": "854796a8a895c814cf5e3377fa9511426154885898125d329e265c28476a426b", "hash": "95b5c96f59dd566e4346f0dacbb6c17971c96fd445f89d4a42d441b593cff46d"}, {"id": 23, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "4", "detail": "记-202611004 已登记日记账", "prev_hash": "afd37be7682b63d50a73195e5df3f7ca072ed51318ce06801a77a53493499ee8", "hash": "854796a8a895c814cf5e3377fa9511426154885898125d329e265c28476a426b"}, {"id": 22, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "4", "detail": "记-202611004 借贷各 1500.00", "prev_hash": "1a903d0d95e2bea8a36bad123f9bad8b07f3a3a4d0f7717891a7bbe30a52dff5", "hash": "afd37be7682b63d50a73195e5df3f7ca072ed51318ce06801a77a53493499ee8"}, {"id": 21, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "审批通过", "entity": "doc", "entity_id": "4", "detail": "BX202611001", "prev_hash": "b9e67ba70c105beb866518f85f82a791a15b402336241db44ff5ae848eebac31", "hash": "1a903d0d95e2bea8a36bad123f9bad8b07f3a3a4d0f7717891a7bbe30a52dff5"}, {"id": 20, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "提交审批", "entity": "doc", "entity_id": "4", "detail": "BX202611001", "prev_hash": "83ac8e7b238c6a3e6f5d14f8bc5ed2076dc7d1b2e75153fae35c6c59a570ea27", "hash": "b9e67ba70c105beb866518f85f82a791a15b402336241db44ff5ae848eebac31"}, {"id": 19, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "新增单据", "entity": "doc", "entity_id": "4", "detail": "费用报销 BX202611001 金额 1500.00", "prev_hash": "ab60025fde706b4e6074c1c5e662a8c972e56626dd66e4446f807408ece47bd7", "hash": "83ac8e7b238c6a3e6f5d14f8bc5ed2076dc7d1b2e75153fae35c6c59a570ea27"}, {"id": 18, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "单据结算", "entity": "doc", "entity_id": "3", "detail": "JZ202611001 生成凭证 记-202611003", "prev_hash": "56ad581a9b4e5d87cef0dd60c1e69996b49114505195db173fa361290b97b1b8", "hash": "ab60025fde706b4e6074c1c5e662a8c972e56626dd66e4446f807408ece47bd7"}, {"id": 17, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "3", "detail": "记-202611003 已登记日记账", "prev_hash": "a2a413b18171205f16cfa522820a0b54d40214ac7775f98a79807ce8900ed5cb", "hash": "56ad581a9b4e5d87cef0dd60c1e69996b49114505195db173fa361290b97b1b8"}, {"id": 16, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "3", "detail": "记-202611003 借贷各 2000.00", "prev_hash": "40906910f0ee787745a887abd36c97e7efa9739779191ce22e24db90d0e6af0f", "hash": "a2a413b18171205f16cfa522820a0b54d40214ac7775f98a79807ce8900ed5cb"}, {"id": 15, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "审批通过", "entity": "doc", "entity_id": "3", "detail": "JZ202611001", "prev_hash": "ac6675bc28e1f286813b46c0f8a8a8c4c4a6144daeb5bc164cb85f2d673c83a5", "hash": "40906910f0ee787745a887abd36c97e7efa9739779191ce22e24db90d0e6af0f"}, {"id": 14, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "提交审批", "entity": "doc", "entity_id": "3", "detail": "JZ202611001", "prev_hash": "b688cbffe814f3d733fd5628bf300105f0f9c26f613a93be8118fdd4ee0f6d2a", "hash": "ac6675bc28e1f286813b46c0f8a8a8c4c4a6144daeb5bc164cb85f2d673c83a5"}, {"id": 13, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "新增单据", "entity": "doc", "entity_id": "3", "detail": "备用金借款 JZ202611001 金额 2000.00", "prev_hash": "5de75db64c34d9b09ee6afaa1c29c6b3f67b48ec1e322e7549561434d5ece7e9", "hash": "b688cbffe814f3d733fd5628bf300105f0f9c26f613a93be8118fdd4ee0f6d2a"}, {"id": 12, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "单据结算", "entity": "doc", "entity_id": "2", "detail": "SK202611001 生成凭证 记-202611002", "prev_hash": "4de84ce1c3815d21a2212b1135b5c1a2fae4546b8a592b1d1a555a3d77a1608d", "hash": "5de75db64c34d9b09ee6afaa1c29c6b3f67b48ec1e322e7549561434d5ece7e9"}, {"id": 11, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "2", "detail": "记-202611002 已登记日记账", "prev_hash": "85fc2743fa080fcebfd31cbe06dbaf4f307fa96b05fd334d15d102ff6ec4d33e", "hash": "4de84ce1c3815d21a2212b1135b5c1a2fae4546b8a592b1d1a555a3d77a1608d"}, {"id": 10, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "2", "detail": "记-202611002 借贷各 25000.00", "prev_hash": "7e310c42771ff1632ffca95bd48f5a76a442ed453a5268fc8a1f3da7b7f12a09", "hash": "85fc2743fa080fcebfd31cbe06dbaf4f307fa96b05fd334d15d102ff6ec4d33e"}, {"id": 9, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "审批通过", "entity": "doc", "entity_id": "2", "detail": "SK202611001", "prev_hash": "cfe4bea93a37e8f8fdfffc05a5dbedece2eeef16cb17225a50afbfa52481e40f", "hash": "7e310c42771ff1632ffca95bd48f5a76a442ed453a5268fc8a1f3da7b7f12a09"}, {"id": 8, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "提交审批", "entity": "doc", "entity_id": "2", "detail": "SK202611001", "prev_hash": "94624a7dc88de5d040a9a962e464272f2fad9b55d85988850352118d41a6c327", "hash": "cfe4bea93a37e8f8fdfffc05a5dbedece2eeef16cb17225a50afbfa52481e40f"}, {"id": 7, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "新增单据", "entity": "doc", "entity_id": "2", "detail": "收款单 SK202611001 金额 25000.00", "prev_hash": "fe4b5de342f15de102dc13d79bf311aff9d6b972b56291ad393d2e5afc33e2ce", "hash": "94624a7dc88de5d040a9a962e464272f2fad9b55d85988850352118d41a6c327"}, {"id": 6, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "单据结算", "entity": "doc", "entity_id": "1", "detail": "FK202611001 生成凭证 记-202611001", "prev_hash": "ef92d823af1752bbd9d26eaf5166420a9a19912d758c6ec99c679da88df66eaf", "hash": "fe4b5de342f15de102dc13d79bf311aff9d6b972b56291ad393d2e5afc33e2ce"}, {"id": 5, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "凭证过账", "entity": "voucher", "entity_id": "1", "detail": "记-202611001 已登记日记账", "prev_hash": "10186d80b53a8550d0f96e293445edc4ed9c95942ca55589354075a3add34b66", "hash": "ef92d823af1752bbd9d26eaf5166420a9a19912d758c6ec99c679da88df66eaf"}, {"id": 4, "at": "2026-11-06T19:27:29", "actor": "出纳", "action": "新增凭证", "entity": "voucher", "entity_id": "1", "detail": "记-202611001 借贷各 350.00", "prev_hash": "f30d18d761fed23deb07bc8c0d2214a8099f1ff3d010dea6ed434937d6c9241b", "hash": "10186d80b53a8550d0f96e293445edc4ed9c95942ca55589354075a3add34b66"}, {"id": 3, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "审批通过", "entity": "doc", "entity_id": "1", "detail": "FK202611001", "prev_hash": "f2f0f55f83ab8dca509c016427cf3a344d144307975455c86949cfbbf121cb4a", "hash": "f30d18d761fed23deb07bc8c0d2214a8099f1ff3d010dea6ed434937d6c9241b"}, {"id": 2, "at": "2026-11-06T19:27:29", "actor": "系统", "action": "提交审批", "entity": "doc", "entity_id": "1", "detail": "FK202611001", "prev_hash": "9e6ffe567dea55f2fbd0052eeb52633104930198d954e00a73537bc97957d72c", "hash": "f2f0f55f83ab8dca509c016427cf3a344d144307975455c86949cfbbf121cb4a"}, {"id": 1, "at": "2026-11-06T19:27:29", "actor": "小李", "action": "新增单据", "entity": "doc", "entity_id": "1", "detail": "付款申请 FK202611001 金额 350.00", "prev_hash": null, "hash": "9e6ffe567dea55f2fbd0052eeb52633104930198d954e00a73537bc97957d72c"}]},"/api/meta|/api/meta": {"subjects": [{"code": "1001", "name": "库存现金", "category": "资产", "direction": "借", "is_cash": 1, "is_bank": 0, "enabled": 1}, {"code": "1002", "name": "银行存款", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 1, "enabled": 1}, {"code": "1122", "name": "应收账款", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1123", "name": "预付账款", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1221", "name": "其他应收款", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1231", "name": "坏账准备", "category": "资产", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1511", "name": "长期股权投资", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1601", "name": "固定资产", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1602", "name": "累计折旧", "category": "资产", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1604", "name": "在建工程", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "1701", "name": "无形资产", "category": "资产", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "2001", "name": "短期借款", "category": "负债", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "2202", "name": "应付账款", "category": "负债", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "2203", "name": "预收账款", "category": "负债", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "2221", "name": "应交税费", "category": "负债", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "2314", "name": "合同负债", "category": "负债", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "2501", "name": "长期借款", "category": "负债", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "4001", "name": "实收资本", "category": "权益", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "4103", "name": "本年利润", "category": "权益", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "4104", "name": "利润分配", "category": "权益", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6001", "name": "主营业务收入", "category": "损益", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6051", "name": "其他业务收入", "category": "损益", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6301", "name": "营业外收入", "category": "损益", "direction": "贷", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6401", "name": "主营业务成本", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6402", "name": "其他业务成本", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6403", "name": "税金及附加", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6601", "name": "销售费用", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6602", "name": "管理费用", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6603", "name": "财务费用", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6604", "name": "研发费用", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6701", "name": "资产减值损失", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6711", "name": "营业外支出", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}, {"code": "6801", "name": "所得税费用", "category": "损益", "direction": "借", "is_cash": 0, "is_bank": 0, "enabled": 1}], "projects": [{"id": 1, "name": "日常运营", "enabled": 1}, {"id": 2, "name": "项目A", "enabled": 1}, {"id": 3, "name": "项目B", "enabled": 1}, {"id": 4, "name": "项目C", "enabled": 1}], "counterparties": [{"id": 1, "name": "A客户", "kind": "客户", "enabled": 1, "tax_id": null, "invoice_title": null, "address_phone": null, "bank_name": null, "bank_account": null}, {"id": 2, "name": "B客户", "kind": "客户", "enabled": 1, "tax_id": null, "invoice_title": null, "address_phone": null, "bank_name": null, "bank_account": null}, {"id": 3, "name": "甲供应商", "kind": "供应商", "enabled": 1, "tax_id": null, "invoice_title": null, "address_phone": null, "bank_name": null, "bank_account": null}, {"id": 4, "name": "乙供应商", "kind": "供应商", "enabled": 1, "tax_id": null, "invoice_title": null, "address_phone": null, "bank_name": null, "bank_account": null}, {"id": 5, "name": "张员工", "kind": "员工", "enabled": 1, "tax_id": null, "invoice_title": null, "address_phone": null, "bank_name": null, "bank_account": null}, {"id": 6, "name": "演示客户甲公司", "kind": "客户", "enabled": 1, "tax_id": "91310000MA1DEMO001", "invoice_title": "演示客户甲公司", "address_phone": "上海市浦东新区演示路1号 021-00000001", "bank_name": "工商银行浦东支行", "bank_account": "100100010001"}, {"id": 7, "name": "演示供应商乙公司", "kind": "供应商", "enabled": 1, "tax_id": "91310000MA1DEMO002", "invoice_title": "演示供应商乙公司", "address_phone": null, "bank_name": "建设银行徐汇支行", "bank_account": "200200020002"}], "bank_accounts": [{"id": 1, "name": "基本户", "bank_name": "工商银行", "account_no": "6222 **** 1234", "currency": "CNY", "opening_balance": 86000.0, "enabled": 1}], "periods": [{"period": "2026-11", "status": "open", "closed_at": null, "closed_by": "出纳"}, {"period": "2026-10", "status": "open", "closed_at": null, "closed_by": null}, {"period": "2026-09", "status": "open", "closed_at": null, "closed_by": null}], "settings": {"company_name": "本公司", "cashier": "出纳", "accountant": "会计", "cash_opening": "5000", "separate_duties": "1", "budget_control": "1", "asset_expense_subject": "6602", "risk_cash_floor": "2000", "risk_bank_floor": "10000", "risk_large_txn": "50000", "risk_safety_months": "3", "risk_recon_days": "7", "risk_budget_warn": "80", "monitor_refresh": "10", "bad_debt_rates": "{\"0-30天\":0.01,\"31-60天\":0.05,\"61-90天\":0.10,\"90天以上\":0.30}", "security_enabled": "0", "security_max_fail": "5", "security_lock_minutes": "15", "security_rate_limit": "60", "security_csrf": "0", "security_mask_fields": "account_no,phone,id_card", "numbering_prefix": "记-", "numbering_digits": "3", "cashier_cash_limit": "20000", "approval_tiers": "[{\"limit\":5000,\"approver\":\"会计\"},{\"limit\":50000,\"approver\":\"财务主管\"},{\"limit\":0,\"approver\":\"总经理\"}]", "taxpayer_type": "general", "vat_rates": "[0.13,0.09,0.06,0.05,0.03,0.01,0]", "surtax_city": "0.07", "surtax_edu": "0.03", "surtax_local": "0.02", "cit_rate": "0.25", "cit_small_tiers": "[{\"limit\":3000000,\"rate\":0.05},{\"limit\":0,\"rate\":0.25}]", "tax_ratio_low": "2.00", "tax_ratio_high": "3.50", "social_employer": "{\"pension\":0.16,\"medical\":0.08,\"unemployment\":0.005,\"injury\":0.002,\"maternity\":0.008}", "social_employee": "{\"pension\":0.08,\"medical\":0.02,\"unemployment\":0.005}", "housing_fund_rate": "0.12", "stamp_taxes": "[{\"name\":\"购销合同\",\"rate\":0.0003},{\"name\":\"产权转移书据\",\"rate\":0.0005},{\"name\":\"营业账簿\",\"rate\":0.00025},{\"name\":\"借款合同\",\"rate\":0.00005}]", "individual_tax_table": "[{\"limit\":36000,\"rate\":0.03,\"quick\":0},{\"limit\":144000,\"rate\":0.10,\"quick\":2520},{\"limit\":300000,\"rate\":0.20,\"quick\":16920},{\"limit\":420000,\"rate\":0.25,\"quick\":31920},{\"limit\":660000,\"rate\":0.30,\"quick\":52920},{\"limit\":960000,\"rate\":0.35,\"quick\":85920},{\"limit\":0,\"rate\":0.45,\"quick\":181920}]", "gateway_default_tax_rate": "0.13", "gateway_invoice_seller": "", "adv_discount_rate": "0.10", "adv_tax_rate": "0.25", "adv_inventory_method": "FIFO", "adv_risk_free": "0.025", "adv_market_return": "0.08", "adv_beta": "1.0", "demo_loaded": "1"}, "migrations": [{"version": 1, "applied_at": "2026-11-06T19:26:57"}, {"version": 2, "applied_at": "2026-11-06T19:26:57"}, {"version": 3, "applied_at": "2026-11-06T19:26:57"}, {"version": 4, "applied_at": "2026-11-06T19:42:38"}, {"version": 5, "applied_at": "2026-11-06T19:53:28"}, {"version": 6, "applied_at": "2026-11-06T20:04:53"}, {"version": 7, "applied_at": "2026-11-06T20:33:37"}, {"version": 8, "applied_at": "2026-11-06T20:43:08"}, {"version": 9, "applied_at": "2026-11-06T22:48:16"}, {"version": 10, "applied_at": "2026-11-07T10:46:52"}, {"version": 11, "applied_at": "2026-11-07T12:17:12"}, {"version": 12, "applied_at": "2026-11-07T13:32:22"}, {"version": 13, "applied_at": "2026-11-07T23:17:31"}, {"version": 14, "applied_at": "2026-11-08T10:01:03"}, {"version": 15, "applied_at": "2026-11-08T10:19:22"}, {"version": 16, "applied_at": "2026-11-08T10:37:40"}, {"version": 17, "applied_at": "2026-11-08T10:48:04"}], "database": "data\\journal.db"}, "/api/todo|/api/todo": {"items": [{"key": "docs", "label": "待审批单据", "page": "docs", "count": 1, "level": "warn", "items": [{"title": "DEMO-DOC-003", "sub": "reimbursement · 演示操作员 · ¥3,390.00", "date": "2026-11-08"}]}, {"key": "vouchers", "label": "未过账凭证", "page": "vouchers", "count": 1, "level": "warn", "items": [{"title": "DEMO-V-003", "sub": "[演示]待审核差旅费", "date": "2026-11-08"}]}, {"key": "statements", "label": "银行流水未匹配", "page": "recon", "count": 0, "level": "done", "items": []}, {"key": "journal", "label": "日记账未核对", "page": "journal", "count": 10, "level": "info", "items": [{"title": "9月销售收入", "sub": "¥18,000.00", "date": "2026-09-18"}, {"title": "10月办公租金", "sub": "¥9,200.00", "date": "2026-10-12"}, {"title": "10月收回货款", "sub": "¥30,000.00", "date": "2026-10-22"}, {"title": "购入 笔记本电脑", "sub": "¥8,000.00", "date": "2026-11-01"}, {"title": "购买办公用品", "sub": "¥350.00", "date": "2026-11-06"}]}, {"key": "invoices", "label": "发票未入账", "page": "invoices", "count": 2, "level": "warn", "items": [{"title": "DEMO-XS-001", "sub": "销项 · ¥56,500.00", "date": "2026-11-08"}, {"title": "DEMO-JX-001", "sub": "进项 · ¥22,600.00", "date": "2026-11-08"}]}, {"key": "invoices_clear", "label": "发票待核销", "page": "partner", "count": 3, "level": "info", "items": [{"title": "FP202611001", "sub": "已入账 · ¥1,130.00", "date": "2026-11-06"}, {"title": "DEMO-XS-001", "sub": "已入账 · ¥56,500.00", "date": "2026-11-08"}, {"title": "DEMO-JX-001", "sub": "已入账 · ¥22,600.00", "date": "2026-11-08"}]}, {"key": "periods", "label": "往期未结账", "page": "periods", "count": 2, "level": "warn", "items": [{"title": "2026-09", "sub": "会计期间仍为开放状态", "date": ""}, {"title": "2026-10", "sub": "会计期间仍为开放状态", "date": ""}]}, {"key": "assets", "label": "在用固定资产", "page": "assets", "count": 1, "level": "info", "items": [{"title": "FA202611001 笔记本电脑", "sub": "原值 ¥8,000.00 · 记得每月计提折旧", "date": "2026-11-01"}]}], "total": 20, "pending": 6, "generated_at": "2026-11-08T14:49:43"}, "/api/work/runs|/api/work/runs": {"items": [{"id": 2, "domain_no": 9, "title": "[演示]流程演示", "stage": 1, "status": "进行中", "owner": "演示操作员", "created_at": "2026-11-08", "short_name": "全税种管理", "subject": "税法", "总步骤": 6, "进度": "1/6"}, {"id": 1, "domain_no": 1, "title": "[演示]流程演示", "stage": 2, "status": "进行中", "owner": "演示操作员", "created_at": "2026-11-08", "short_name": "账务核算", "subject": "中级会计实务", "总步骤": 8, "进度": "2/8"}], "进行中": 2}, "/api/work/demo/status|/api/work/demo/status": {"已载入": true, "记录数": 51, "覆盖表": 30, "明细": [{"tbl": "accruals", "n": 1}, {"tbl": "adv_assets", "n": 1}, {"tbl": "adv_inventory_moves", "n": 3}, {"tbl": "adv_workflows", "n": 1}, {"tbl": "audit_confirmations", "n": 1}, {"tbl": "audit_findings", "n": 1}, {"tbl": "audit_plans", "n": 1}, {"tbl": "audit_workpapers", "n": 1}, {"tbl": "bills", "n": 1}, {"tbl": "cash_counts", "n": 1}, {"tbl": "contract_milestones", "n": 1}, {"tbl": "contracts", "n": 1}, {"tbl": "counterparties", "n": 2}, {"tbl": "docs", "n": 3}, {"tbl": "employees", "n": 1}, {"tbl": "estimate_changes", "n": 1}, {"tbl": "external_tasks", "n": 2}, {"tbl": "industry_benchmarks", "n": 1}, {"tbl": "invoices", "n": 2}, {"tbl": "journal", "n": 2}, {"tbl": "legal_cases", "n": 1}, {"tbl": "legal_reviews", "n": 3}, {"tbl": "macro_indicators", "n": 2}, {"tbl": "related_parties", "n": 1}, {"tbl": "special_deductions", "n": 1}, {"tbl": "tax_input_certs", "n": 1}, {"tbl": "voucher_lines", "n": 6}, {"tbl": "vouchers", "n": 3}, {"tbl": "work_runs", "n": 2}, {"tbl": "work_step_logs", "n": 3}]}, "/api/work/dashboard|/api/work/dashboard": {"工作数": 11, "工作流步骤": 79, "执行动作": 76, "已支撑步骤": 43, "断链步骤": 36, "断链动作": 34, "我的进行中": 2, "四流": ["数据流", "价值流", "工作流", "执行流"], "提示": "选一项工作 → 看四流 → 按步骤办理 → 每步直接跳到对应功能"}, "/api/work/works|/api/work/works": {"items": [{"id": 1, "no": 1, "exam_type": "中级会计职称", "subject": "中级会计实务", "short_name": "账务核算", "detail": "1. 资产核算：存货、固定资产、无形资产、投资性房地产、长期股权投资、金融资产与金融负债、资产减值\n2. 负债权益：应付职工薪酬、借款费用、或有事项、债务重组、所有者权益、政府补助\n3. 损益核算：收入、所得税、非货币性资产交换、租赁\n4. 会计调整：会计政策 / 估计变更与差错更正、资产负债表日后事项、外币折算\n5. 报告与特殊主体：个别财务报表、合并财务报表、政府会计、民间非营利组织会计", "data_note": "数据从业务端采集，经会计加工后输出为标准化财务信息", "value_text": "通过权责发生制完整反映企业财务状况、经营成果与现金流量，为内部管理、纳税申报、外部融资提供基础财务数据，是财务价值的底层载体", "work_note": "企业账务核算的标准闭环流程", "created_at": "2026-11-08 10:37:49", "步骤数": 8, "动作数": 7, "已支撑步骤": 7, "进行中": 1}, {"id": 2, "no": 2, "exam_type": "中级会计职称", "subject": "财务管理", "short_name": "财务与预算", "detail": "1. 基础工具：货币时间价值、风险与收益、全面预算管理\n2. 筹资管理：筹资方式、资本成本、杠杆效应、资本结构、衍生工具筹资\n3. 投资管理：项目投资决策、证券投资、基金投资\n4. 营运与成本：营运资金管理（现金、应收、存货）、本量利分析、标准成本、责任成本\n5. 分配与评价：收入与分配管理、财务指标分析、杜邦分析体系", "data_note": "数据从核算层提取，经加工形成管理决策数据", "value_text": "将财务数据转化为经营决策支撑，优化资金效率、控制成本、提升投资回报率、匹配最优资本结构，直接服务于企业盈利与价值增长", "work_note": "", "created_at": "2026-11-08 10:37:49", "步骤数": 12, "动作数": 6, "已支撑步骤": 7, "进行中": 0}, {"id": 3, "no": 3, "exam_type": "中级会计职称", "subject": "经济法", "short_name": "合同法务（中级）", "detail": "1. 市场主体法：公司法律制度、合伙企业法律制度、物权法律制度\n2. 交易法律：合同法律制度（总则 + 分则）\n3. 金融法律：票据、证券、保险法律制度\n4. 财税法律：增值税法律制度、企业所得税法律制度\n5. 其他：反垄断与反不正当竞争、知识产权、政府采购", "data_note": "法律与涉税数据从业务端流入，经合规校验后反馈至业务与财务端", "value_text": "保障企业经营合法合规、规避法律与税务风险、维护企业权益、优化税务成本，为业务开展提供合规边界与风险兜底", "work_note": "贯穿业务事前、事中、事后的全流程合规管控", "created_at": "2026-11-08 10:37:49", "步骤数": 4, "动作数": 6, "已支撑步骤": 4, "进行中": 0}, {"id": 4, "no": 4, "exam_type": "高级会计职称", "subject": "高级会计实务（开卷案例，侧重高阶管理）", "short_name": "集团与战略财务", "detail": "1. 战略管理：企业战略与财务战略、数字化财务转型\n2. 预算管理：全面预算管理、滚动预算、预算绩效\n3. 投融资与并购：投资决策、融资决策、集团资金管理、企业并购重组\n4. 成本与绩效：目标成本、作业成本、生命周期成本、EVA、平衡计分卡\n5. 内控与风险：企业内部控制、全面风险管理、金融工具风险\n6. 特殊业务：股权激励、套期会计、金融工具会计\n7. 行政事业：行政事业单位预算、会计、内控、政府采购", "data_note": "覆盖集团全层级、全业务的管理数据链路", "value_text": "站在集团与高管层面，支撑战略落地、资源配置优化、重大投融资决策、风险体系搭建，直接服务于企业顶层价值管理与长期发展", "work_note": "", "created_at": "2026-11-08 10:37:49", "步骤数": 11, "动作数": 8, "已支撑步骤": 5, "进行中": 0}, {"id": 5, "no": 5, "exam_type": "注册会计师（CPA）专业阶段", "subject": "会计", "short_name": "准则核算", "detail": "1. 基础核算：存货、固定资产、无形资产、投资性房地产、负债、所有者权益\n2. 核心难点：长期股权投资与合营安排、金融工具、收入、所得税、租赁、企业合并\n3. 特殊交易：非货币性资产交换、债务重组、外币折算、会计差错更正、日后事项、持有待售资产\n4. 报告披露：财务报表列报、合并财务报表、每股收益、公允价值计量\n5. 特殊主体：政府及民间非营利组织会计", "data_note": "覆盖常规到复杂特殊交易的全场景财务数据加工链路", "value_text": "按照会计准则精准核算所有类型交易，输出符合准则的高质量财务信息，保障财务报表公允性与合规性，是资本市场信息披露、审计、投融资的核心价值基础", "work_note": "", "created_at": "2026-11-08 10:37:49", "步骤数": 7, "动作数": 7, "已支撑步骤": 4, "进行中": 0}, {"id": 6, "no": 6, "exam_type": "注册会计师（CPA）专业阶段", "subject": "审计", "short_name": "审计鉴证", "detail": "1. 审计基础：审计原理、审计计划、审计证据、审计抽样、信息技术审计\n2. 风险导向流程：风险评估、风险应对\n3. 循环审计：销售与收款、采购与付款、生产与存货、货币资金审计\n4. 特殊项目：舞弊、法律法规、关联方、持续经营、会计估计审计\n5. 完成与报告：审计工作完成、审计报告、关键审计事项、内部控制审计\n6. 质量与道德：事务所质量管理、职业道德与独立性", "data_note": "第三方鉴证视角的数据验证与流转链路", "value_text": "独立鉴证财务报表的公允性与合规性，降低资本市场信息不对称，提升财务信息公信力，同时通过内控审计优化企业风控体系", "work_note": "", "created_at": "2026-11-08 10:37:49", "步骤数": 8, "动作数": 7, "已支撑步骤": 2, "进行中": 0}, {"id": 7, "no": 7, "exam_type": "注册会计师（CPA）专业阶段", "subject": "财务成本管理", "short_name": "成本与估值", "detail": "1. 财务分析：财务报表分析、财务预测、价值评估基础\n2. 长期投融资：资本成本、项目资本预算、期权价值评估、长期筹资、股利分配\n3. 营运资本：营运资本投资 / 筹资策略、现金 / 应收 / 存货管理\n4. 成本会计：产品成本计算（品种 / 分批 / 分步法）、标准成本法、作业成本法\n5. 管理会计：本量利分析、短期经营决策、全面预算、责任会计、EVA 业绩评价", "data_note": "", "value_text": "通过量化模型优化资本配置、提升投资回报率、精细化成本管控、支撑短期经营决策，构建企业价值量化管理体系，直接驱动盈利与效率提升", "work_note": "贯穿企业资金、成本、决策的全价值管理流程", "created_at": "2026-11-08 10:37:49", "步骤数": 5, "动作数": 8, "已支撑步骤": 3, "进行中": 0}, {"id": 8, "no": 8, "exam_type": "注册会计师（CPA）专业阶段", "subject": "经济法", "short_name": "商事合规", "detail": "1. 民事基础：民事法律制度、物权法律制度、合同法律制度\n2. 商事主体：合伙企业、公司法律制度（设立、治理、股权、清算）\n3. 资本市场：证券发行、交易、上市公司收购、信息披露\n4. 破产与支付：企业破产法律制度、票据与支付结算法律制度\n5. 其他：反垄断法律制度、涉外经济法律制度", "data_note": "覆盖民商事全场景的法律数据流转与校验", "value_text": "为资本市场运作、公司治理、交易安全、破产清算提供法律合规支撑，防范商事法律风险，保障市场交易秩序与企业合法权益", "work_note": "全商事场景合规管控", "created_at": "2026-11-08 10:37:49", "步骤数": 5, "动作数": 7, "已支撑步骤": 4, "进行中": 0}, {"id": 9, "no": 9, "exam_type": "注册会计师（CPA）专业阶段", "subject": "税法", "short_name": "全税种管理", "detail": "1. 货物劳务税：增值税、消费税、关税、船舶吨税\n2. 所得税：企业所得税、个人所得税、国际税收\n3. 财产资源税：资源税、环保税、房产税、契税、土地增值税、印花税等 10 余个小税种\n4. 征管法制：税收征收管理法、税务行政法制、发票管理", "data_note": "", "value_text": "精准履行纳税义务、防范税务风险、合法优化税务成本、处理国际税收与复杂涉税事项，保障企业税务合规，实现税负最优", "work_note": "全税种、全周期的税务管理闭环", "created_at": "2026-11-08 10:37:49", "步骤数": 6, "动作数": 8, "已支撑步骤": 6, "进行中": 1}, {"id": 10, "no": 10, "exam_type": "注册会计师（CPA）专业阶段", "subject": "公司战略与风险管理", "short_name": "战略与风控", "detail": "1. 战略分析：PEST 分析、产业环境、竞争环境、企业资源能力、价值链\n2. 战略选择：总体战略、业务单位战略、职能战略、国际化经营战略\n3. 战略实施：组织结构、企业文化、战略控制、数字化转型\n4. 风险与内控：风险管理流程、风险理财、内部控制系统", "data_note": "覆盖企业内外部的战略与风险数据链路", "value_text": "帮助企业识别外部机遇与风险、匹配自身资源制定发展战略、搭建全面风险管理体系，保障企业长期可持续发展与战略目标落地", "work_note": "监控的全流程风险管理", "created_at": "2026-11-08 10:37:49", "步骤数": 8, "动作数": 7, "已支撑步骤": 1, "进行中": 0}, {"id": 11, "no": 11, "exam_type": "注册会计师（CPA）综合阶段", "subject": "职业能力综合测试（试卷一 + 试卷二）", "short_name": "重大项目综合", "detail": "无独立子科目；试卷一整合会计、审计、税法；试卷二整合财管、战略、经济法，侧重跨科目复杂场景综合应用", "data_note": "全链路、跨领域的综合数据处理", "value_text": "针对企业并购重组、IPO、集团管控等复杂业务提供全维度专业解决方案，支撑企业重大资本运作与合规运营", "work_note": "重大项目的全流程综合管理", "created_at": "2026-11-08 10:37:49", "步骤数": 5, "动作数": 5, "已支撑步骤": 0, "进行中": 0}], "总数": 11}, "/api/work/gaps|/api/work/gaps": {"断链步骤": [{"domain_no": 1, "short_name": "账务核算", "seq": 7, "name": "结账", "coverage": "部分支撑", "system_entry": "结账与归档"}, {"domain_no": 2, "short_name": "财务与预算", "seq": 2, "name": "执行监控", "coverage": "部分支撑", "system_entry": "预算与差异分析"}, {"domain_no": 2, "short_name": "财务与预算", "seq": 3, "name": "差异分析", "coverage": "部分支撑", "system_entry": "预算与差异分析"}, {"domain_no": 2, "short_name": "财务与预算", "seq": 6, "name": "落地执行", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 2, "short_name": "财务与预算", "seq": 7, "name": "效果复盘", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 2, "short_name": "财务与预算", "seq": 11, "name": "绩效指标设定", "coverage": "部分支撑", "system_entry": "高阶核算与决策模型"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 1, "name": "战略制定", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 2, "name": "目标拆解", "coverage": "部分支撑", "system_entry": "战略与风控（待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 4, "name": "重大投融资 / 并购立项", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 5, "name": "尽调", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 6, "name": "方案设计", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 8, "name": "落地整合", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 5, "short_name": "准则核算", "seq": 1, "name": "复杂业务会计判断", "coverage": "部分支撑", "system_entry": "准则核算（部分待建）"}, {"domain_no": 5, "short_name": "准则核算", "seq": 4, "name": "合并报表编制", "coverage": "待建", "system_entry": "合并报表（待建）"}, {"domain_no": 5, "short_name": "准则核算", "seq": 6, "name": "审计对接", "coverage": "部分支撑", "system_entry": "财务报表"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 1, "name": "业务承接", "coverage": "部分支撑", "system_entry": "内部审计"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 2, "name": "初步业务活动", "coverage": "部分支撑", "system_entry": "内部审计"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 3, "name": "制定审计策略与计划", "coverage": "部分支撑", "system_entry": "内部审计"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 6, "name": "特殊事项审计", "coverage": "部分支撑", "system_entry": "对账与函证"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 7, "name": "完成审计", "coverage": "部分支撑", "system_entry": "结账与归档"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 8, "name": "出具报告", "coverage": "部分支撑", "system_entry": "结账与归档"}, {"domain_no": 7, "short_name": "成本与估值", "seq": 2, "name": "投融资方案量化评估", "coverage": "部分支撑", "system_entry": "高阶核算与决策模型"}, {"domain_no": 7, "short_name": "成本与估值", "seq": 5, "name": "预算与责任考核", "coverage": "部分支撑", "system_entry": "高阶核算与决策模型"}, {"domain_no": 8, "short_name": "商事合规", "seq": 1, "name": "公司设立 / 治理 / 重组流程", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 1, "name": "内外部环境分析", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 2, "name": "战略制定", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 3, "name": "战略拆解与落地", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 4, "name": "执行监控", "coverage": "部分支撑", "system_entry": "战略与风控（待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 5, "name": "战略调整", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 7, "name": "评估", "coverage": "部分支撑", "system_entry": "内控与风险闭环"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 8, "name": "应对", "coverage": "部分支撑", "system_entry": "内控与风险闭环"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 1, "name": "复杂业务立项", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 2, "name": "多维度尽调", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 3, "name": "跨专业方案设计", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 4, "name": "落地执行", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 5, "name": "风险把控", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}], "断链动作": [{"domain_no": 1, "short_name": "账务核算", "seq": 5, "name": "编制三大报表", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 1, "short_name": "账务核算", "seq": 6, "name": "合并报表抵消分录编制", "coverage": "待建", "system_entry": "合并报表（待建）"}, {"domain_no": 3, "short_name": "合同法务（中级）", "seq": 4, "name": "增值税 / 企业所得税申报", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 3, "short_name": "合同法务（中级）", "seq": 5, "name": "税务优惠适用判断", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 1, "name": "制定集团财务战略", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 4, "name": "并购重组方案设计", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 5, "name": "搭建集团资金池", "coverage": "待建", "system_entry": "合并报表（待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 6, "name": "设计股权激励方案", "coverage": "部分支撑", "system_entry": "准则核算（部分待建）"}, {"domain_no": 4, "short_name": "集团与战略财务", "seq": 8, "name": "设计平衡计分卡绩效体系", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 5, "short_name": "准则核算", "seq": 1, "name": "复杂金融工具核算", "coverage": "部分支撑", "system_entry": "准则核算（部分待建）"}, {"domain_no": 5, "short_name": "准则核算", "seq": 2, "name": "长投权益法 / 成本法转换", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 5, "short_name": "准则核算", "seq": 3, "name": "合并报表抵消调整", "coverage": "待建", "system_entry": "合并报表（待建）"}, {"domain_no": 5, "short_name": "准则核算", "seq": 4, "name": "收入五步法应用", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 5, "short_name": "准则核算", "seq": 5, "name": "递延所得税核算", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 5, "short_name": "准则核算", "seq": 6, "name": "使用权资产 / 租赁负债核算", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 1, "name": "设计审计程序", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 3, "name": "编制审计工作底稿", "coverage": "部分支撑", "system_entry": "内部审计"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 4, "name": "识别重大错报风险", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 5, "name": "出具标准 / 非标准审计报告", "coverage": "部分支撑", "system_entry": "结账与归档"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 6, "name": "执行内控审计", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 6, "short_name": "审计鉴证", "seq": 7, "name": "把控审计质量与独立性", "coverage": "部分支撑", "system_entry": "内部审计"}, {"domain_no": 7, "short_name": "成本与估值", "seq": 4, "name": "产品成本分步法核算", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 7, "short_name": "成本与估值", "seq": 6, "name": "盈亏临界点测算", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 7, "short_name": "成本与估值", "seq": 7, "name": "短期经营差量分析", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 8, "short_name": "商事合规", "seq": 3, "name": "证券发行合规判断", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 8, "short_name": "商事合规", "seq": 5, "name": "破产债权申报与清偿", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 9, "short_name": "全税种管理", "seq": 3, "name": "个税代扣代缴", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 1, "name": "开展 PEST 与波特五力分析", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 2, "name": "制定发展与竞争战略", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 3, "name": "设计组织结构匹配战略", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 6, "name": "设计内控流程", "coverage": "待建", "system_entry": "全局搜索"}, {"domain_no": 10, "short_name": "战略与风控", "seq": 7, "name": "数字化转型规划", "coverage": "待建", "system_entry": "战略与风控（待建）"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 1, "name": "设计并购重组全流程方案", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}, {"domain_no": 11, "short_name": "重大项目综合", "seq": 2, "name": "IPO 财务与合规梳理", "coverage": "部分支撑", "system_entry": "重大项目（部分待建）"}], "步骤数": 36, "动作数": 34, "说明": "断链 = 该项工作在这一步没有现成系统功能，需人工办理或后续轮次补齐"}, "/api/work/seven/dashboard|/api/work/seven/dashboard": {"七流": ["数据流", "资金流", "工作流", "执行流", "管控流", "价值流", "合规流"], "工作数": 11, "岗位数": 5, "流节点": 564, "岗位流节点": 171, "进阶梯度": 15, "说明": "表2 定义工作要跑通哪 7 条流；表3 定义谁、按什么能力级别跑"}, "/api/work/seven/roles|/api/work/seven/roles": {"items": [{"id": 1, "no": 1, "name": "财务核算类", "posts": "应收应付会计、成本会计、总账会计、合并报表会计、核算主管", "exam_subjects": "1. 中级会计实务\n2. CPA 会计\n3. 高级会计实务（核算与合并模块）", "knowledge": "1. 中级：存货 / 固资 / 无形等基础资产核算、日常损益核算、单体报表编制、基础合并报表\n2. CPA：长投与合营安排、金融工具、收入五步法、所得税会计、租赁准则、多层级合并报表、特殊交易核算、报表附注披露\n3. 高会：集团复杂合并、套期会计、股权激励会计、反向购买等特殊业务", "value_text": "输出准确、合规的标准化财务核算数据，为纳税申报、银行融资、内部经营分析提供可靠数据底座，保障财务信息真实性与可追溯性", "created_at": "2026-11-08 10:49:08", "进阶级数": 3, "流节点数": 36}, {"id": 2, "no": 2, "name": "审计类", "posts": "外部审计师（事务所）、内部审计师、内控专员、审计主管、风控专员", "exam_subjects": "1. CPA 审计\n2. 中级经济法 / CPA 经济法\n3. 高级会计实务（内控与风险管理模块）", "knowledge": "1. CPA 审计：风险评估与应对、四大循环审计、审计抽样、信息技术审计、集团审计、特殊项目审计、审计报告、内控审计、质量管理与独立性\n2. 经济法：公司治理、合同合规、票据合规、证券合规\n3. 高会：内控体系搭建、全面风险管理、内控评价与审计", "value_text": "第三方鉴证财务报表公允性，降低资本市场信息不对称；识别企业内控缺陷与经营风险；防范舞弊风险；提升财务信息公信力与企业信用价值", "created_at": "2026-11-08 10:49:08", "进阶级数": 3, "流节点数": 33}, {"id": 3, "no": 3, "name": "税务管理类", "posts": "税务专员、税务主管、税务经理、国际税务专员、税务筹划顾问", "exam_subjects": "1. 中级经济法（税法模块）\n2. CPA 税法\n3. 高级会计实务（税务筹划与并购税务模块）", "knowledge": "1. 中级：增值税、企业所得税基础核算与申报\n2. CPA 税法：18 个税种全口径核算、国际税收、转让定价、出口退税、税务稽查应对、税收征管法、税务行政复议\n3. 高会：并购重组税务处理、集团税务架构、跨境税务筹划、重大交易税务优化", "value_text": "保障企业全税种税务合规，防范税务稽查风险；合法优化整体税负；维护企业税务信用等级；支撑重大交易税务成本最优", "created_at": "2026-11-08 10:49:08", "进阶级数": 3, "流节点数": 34}, {"id": 4, "no": 4, "name": "财务管理 / 管理会计类", "posts": "财务分析、预算管理、成本管理、资金管理、绩效专员、财务 BP、管理会计主管", "exam_subjects": "1. 中级财务管理\n2. CPA 财务成本管理\n3. CPA 公司战略与风险管理\n4. 高级会计实务（预算 / 成本 / 绩效 / 资金模块）", "knowledge": "1. 中级：全面预算、筹资投资、营运资金、本量利分析、标准成本、杜邦分析、绩效评价\n2. CPA 财管：企业价值评估、项目资本预算、期权估值、作业成本法、短期经营决策、责任会计、EVA\n3. CPA 战略：战略分析、价值链、数字化转型、风险管理\n4. 高会：滚动预算、零基预算、目标成本、平衡计分卡、集团资金管理", "value_text": "将财务数据转化为经营决策支撑，优化资源配置、提升资金使用效率、精细化管控成本、驱动企业盈利增长与运营效率提升", "created_at": "2026-11-08 10:49:08", "进阶级数": 3, "流节点数": 38}, {"id": 5, "no": 5, "name": "高阶财务管理类", "posts": "财务经理、财务总监、集团财务负责人、资本运作负责人、CFO 助理", "exam_subjects": "1. 高级会计实务\n2. CPA 综合阶段\n3. CPA 六科综合应用", "knowledge": "1. 高会：企业财务战略、全面预算管理、企业并购、集团资金管理、内控与风险管理、股权激励、数字化财务转型\n2. CPA 综合：跨科目融合应用、并购重组全流程、IPO 财务合规、集团管控、资本运作、重大风险应对", "value_text": "站在集团层面支撑战略落地、优化全局资源配置、主导重大资本运作增值、搭建风险兜底体系，实现企业整体价值最大化与长期可持续发展", "created_at": "2026-11-08 10:49:08", "进阶级数": 3, "流节点数": 30}], "总数": 5, "流名": ["数据流", "资金流", "工作流", "执行流", "管控流", "价值流", "合规流"]}, "/api/work/seven/compliance|/api/work/seven/compliance": {"法规": ["《企业内部控制基本规范》", "《企业破产法》", "《会计档案管理办法》", "《公司法》", "《合伙企业法》", "《民法典》", "《票据法》", "《证券法》", "严格遵循企业会计准则", "严格遵循现行税收法", "事业业务符合预算法", "企业内部控制基本规范", "企业所得税法", "企业破产法", "会计档案管理办法", "公司法", "公司法等多维度法", "务全流程符合会计准则", "反垄断法", "合伙企业法", "合内控与风险管理规范", "处理匹配企业会计准则", "审计准则", "并等核心事项符合准则", "并购重组符合证券法", "循注册会计师审计准则", "成本核算符合会计准则", "收入等符合准则", "政府采购法", "政府采购等法", "易涉税处理符合税法", "模型参数符合行业规范", "涉外法", "涉税核算符合税法", "票据法", "税务筹划符合税法", "管理符合发票管理办法", "管理符合质量控制准则", "纳税申报符合征管法", "经营符合反垄断法", "证券法", "证据获取符合准则", "评价符合公司考核办法"], "数量": 43, "系统检查点": [{"检查点": "凭证合规体检", "页面": "vcheck"}, {"检查点": "内控合规", "页面": "compliance"}, {"检查点": "审计哈希链", "页面": "audit"}, {"检查点": "税务申报测算", "页面": "tax_center"}, {"检查点": "合规义务倒计时", "页面": "legal_center"}], "说明": "合规流为法规要求清单，系统提供检查点，不替代法定审核与签署"}, "/api/work/seven/controls|/api/work/seven/controls": {"items": [{"工作": "账务核算", "控制点": "不相容岗位分离（制单 / 审核、出纳 / 记账）", "系统支撑": "已支撑：职责分离 + RBAC"}, {"工作": "账务核算", "控制点": "资金支付分级授权审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "账务核算", "控制点": "大额资产购置 / 处置审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "账务核算", "控制点": "减值计提与转回审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "账务核算", "控制点": "期末结账审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "账务核算", "控制点": "合并范围认定审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "账务核算", "控制点": "报表多级审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "账务核算", "控制点": "定期内部监盘", "系统支撑": "部分支撑：现金盘点/资产台账"}, {"工作": "财务与预算", "控制点": "预算执行刚性管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "财务与预算", "控制点": "投融资项目分级审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "财务与预算", "控制点": "重大投资集体决策", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "财务与预算", "控制点": "成本费用定额管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "财务与预算", "控制点": "绩效指标刚性考核", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "财务与预算", "控制点": "资金使用额度管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "财务与预算", "控制点": "财务分析定期汇报机制", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "合同法务（中级）", "控制点": "合同分级审批机制", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "合同法务（中级）", "控制点": "重大合同法务必审", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "合同法务（中级）", "控制点": "主体资质准入审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "合同法务（中级）", "控制点": "票据印鉴分管", "系统支撑": "已支撑：职责分离 + RBAC"}, {"工作": "合同法务（中级）", "控制点": "税务申报多级复核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "合同法务（中级）", "控制点": "法律纠纷上报机制", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "合同法务（中级）", "控制点": "合规定期自查机制", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "集团与战略财务", "控制点": "集团重大事项集体决策", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "集团与战略财务", "控制点": "投融资分级授权审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "集团与战略财务", "控制点": "预算刚性管控与考核", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "集团与战略财务", "控制点": "资金集中管控与大额支付审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "集团与战略财务", "控制点": "内控定期评价审计", "系统支撑": "部分支撑：内控闭环 + 风险清单"}, {"工作": "集团与战略财务", "控制点": "子公司绩效考核管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "集团与战略财务", "控制点": "重大风险上报与应对机制", "系统支撑": "部分支撑：内控闭环 + 风险清单"}, {"工作": "准则核算", "控制点": "复杂交易会计处理专项审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "准则核算", "控制点": "合并范围认定多级审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "准则核算", "控制点": "重大会计估计变更审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "准则核算", "控制点": "金融工具估值模型校验", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "准则核算", "控制点": "报表披露内容合规审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "准则核算", "控制点": "审计差异调整审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "准则核算", "控制点": "会计政策变更董事会审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "审计鉴证", "控制点": "审计业务承接审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "审计鉴证", "控制点": "审计计划逐级审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "审计鉴证", "控制点": "工作底稿三级复核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "审计鉴证", "控制点": "关键审计事项合伙人审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "审计鉴证", "控制点": "非标准意见专项审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "审计鉴证", "控制点": "独立性定期核查", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "审计鉴证", "控制点": "事务所质量管理体系监控", "系统支撑": "部分支撑：内控闭环 + 风险清单"}, {"工作": "成本与估值", "控制点": "重大投资项目量化评审", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "成本与估值", "控制点": "资本预算刚性管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "成本与估值", "控制点": "成本定额与标准成本管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "成本与估值", "控制点": "预算执行差异分析与考核", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "成本与估值", "控制点": "责任中心权责划分", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "成本与估值", "控制点": "绩效指标刚性考核", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "成本与估值", "控制点": "重大筹资方案集体决策", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "商事合规", "控制点": "重大合同多级审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "商事合规", "控制点": "上市公司信息披露审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "商事合规", "控制点": "重大资产重组合规审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "商事合规", "控制点": "票据印鉴与权限分管", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "商事合规", "控制点": "破产事项专项管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "商事合规", "控制点": "反垄断合规审查机制", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "商事合规", "控制点": "涉外业务外汇管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "全税种管理", "控制点": "纳税申报多级复核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "全税种管理", "控制点": "大额税款缴纳审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "全税种管理", "控制点": "税收优惠备案审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "全税种管理", "控制点": "税务筹划方案合规评审", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "全税种管理", "控制点": "税务稽查专项应对", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "全税种管理", "控制点": "发票领用与开具管控", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "全税种管理", "控制点": "涉税岗位不相容分离", "系统支撑": "已支撑：职责分离 + RBAC"}, {"工作": "战略与风控", "控制点": "战略制定董事会审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "战略与风控", "控制点": "重大风险事项上报机制", "系统支撑": "部分支撑：内控闭环 + 风险清单"}, {"工作": "战略与风控", "控制点": "内控体系定期评价考核", "系统支撑": "部分支撑：内控闭环 + 风险清单"}, {"工作": "战略与风控", "控制点": "战略执行定期复盘调整", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "战略与风控", "控制点": "重大风险应对方案审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "战略与风控", "控制点": "公司治理机制监督", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "重大项目综合", "控制点": "重大资本运作集体决策", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "重大项目综合", "控制点": "跨部门协同管控机制", "系统支撑": "待建：纳入后续合规轮次"}, {"工作": "重大项目综合", "控制点": "全流程风险节点管控", "系统支撑": "部分支撑：内控闭环 + 风险清单"}, {"工作": "重大项目综合", "控制点": "多级合规审核", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "重大项目综合", "控制点": "信息披露严格审批", "系统支撑": "已支撑：审批状态机 + 分级授权"}, {"工作": "重大项目综合", "控制点": "集团层面统一管控", "系统支撑": "待建：纳入后续合规轮次"}], "总数": 76, "系统控制能力": ["制单/审核职责分离（separate_duties）", "凭证二级审核", "期末结账审批", "RBAC 角色权限", "审计哈希链防篡改", "敏感操作单独标记", "安全中心默认只观测"]}, "/api/competency/coverage|/api/competency/coverage": {"__err": "HTTP Error 404: Not Found"}, "/api/competency/dashboard|/api/competency/dashboard": {"__err": "HTTP Error 404: Not Found"}, "/api/work/graph|/api/work/graph?no=1": {"center": {"no": 1, "subject": "中级会计实务", "short": "账务核算"}, "nodes": [{"id": "work", "type": "工作", "label": "中级会计实务", "page": "work_1", "考试类型": "中级会计职称", "价值主张": "通过权责发生制完整反映企业财务状况、经营成果与现金流量，为内部管理、纳税申报、外部融资提供基础财务数据，是财务价值的底层…"}, {"id": "step:1", "type": "流程步骤", "label": "业务单据收集", "page": "docs", "支撑": "已支撑"}, {"id": "data:1", "type": "数据对象", "label": "原始业务单据（发票、出入库单、合同等）", "系统对象": "业务单据 / 发票台账", "相关表": "docs"}, {"id": "action:1", "type": "执行动作", "label": "编制会计分录", "page": "vouchers", "支撑": "已支撑"}, {"id": "step:2", "type": "流程步骤", "label": "制单录入", "page": "vouchers", "支撑": "已支撑"}, {"id": "data:2", "type": "数据对象", "label": "记账凭证", "系统对象": "记账凭证", "相关表": "vouchers、voucher_lines"}, {"id": "action:2", "type": "执行动作", "label": "计提折旧 / 摊销 / 减值", "page": "periods", "支撑": "已支撑"}, {"id": "step:3", "type": "流程步骤", "label": "凭证审核", "page": "vouchers", "支撑": "已支撑"}, {"id": "data:3", "type": "数据对象", "label": "明细分类账", "系统对象": "业务数据", "相关表": "—"}, {"id": "action:3", "type": "执行动作", "label": "结转成本损益", "page": "periods", "支撑": "已支撑"}, {"id": "step:4", "type": "流程步骤", "label": "记账过账", "page": "vouchers", "支撑": "已支撑"}, {"id": "data:4", "type": "数据对象", "label": "总分类账", "系统对象": "业务数据", "相关表": "—"}, {"id": "action:4", "type": "执行动作", "label": "对账调账", "page": "recon", "支撑": "已支撑"}, {"id": "step:5", "type": "流程步骤", "label": "期末计提 / 摊销 / 结转", "page": "periods", "支撑": "已支撑"}, {"id": "data:5", "type": "数据对象", "label": "科目余额表", "系统对象": "明细账 / 总账 / 科目余额表", "相关表": "opening_balances、voucher_lines"}, {"id": "action:5", "type": "执行动作", "label": "编制三大报表", "page": "search", "支撑": "待建"}, {"id": "step:6", "type": "流程步骤", "label": "对账", "page": "recon", "支撑": "已支撑"}, {"id": "data:6", "type": "数据对象", "label": "单体 / 合并财务报表", "系统对象": "三大财务报表", "相关表": "voucher_lines、subjects"}, {"id": "action:6", "type": "执行动作", "label": "合并报表抵消分录编制", "page": "competency_center", "支撑": "待建"}, {"id": "step:7", "type": "流程步骤", "label": "结账", "page": "periods", "支撑": "部分支撑"}, {"id": "action:7", "type": "执行动作", "label": "纳税调整基础核算", "page": "periods", "支撑": "已支撑"}, {"id": "step:8", "type": "流程步骤", "label": "财务报表编制", "page": "fin", "支撑": "已支撑"}], "edges": [{"from": "work", "to": "step:1", "label": "步骤1"}, {"from": "step:1", "to": "data:1", "label": "产出"}, {"from": "step:1", "to": "action:1", "label": "动作"}, {"from": "work", "to": "step:2", "label": "步骤2"}, {"from": "step:2", "to": "data:2", "label": "产出"}, {"from": "step:2", "to": "action:2", "label": "动作"}, {"from": "work", "to": "step:3", "label": "步骤3"}, {"from": "step:3", "to": "data:3", "label": "产出"}, {"from": "step:3", "to": "action:3", "label": "动作"}, {"from": "work", "to": "step:4", "label": "步骤4"}, {"from": "step:4", "to": "data:4", "label": "产出"}, {"from": "step:4", "to": "action:4", "label": "动作"}, {"from": "work", "to": "step:5", "label": "步骤5"}, {"from": "step:5", "to": "data:5", "label": "产出"}, {"from": "step:5", "to": "action:5", "label": "动作"}, {"from": "work", "to": "step:6", "label": "步骤6"}, {"from": "step:6", "to": "data:6", "label": "产出"}, {"from": "step:6", "to": "action:6", "label": "动作"}, {"from": "work", "to": "step:7", "label": "步骤7"}, {"from": "step:7", "to": "data:6", "label": "产出"}, {"from": "step:7", "to": "action:7", "label": "动作"}, {"from": "work", "to": "step:8", "label": "步骤8"}, {"from": "step:8", "to": "data:6", "label": "产出"}, {"from": "step:8", "to": "action:7", "label": "动作"}], "统计": {"节点": 22, "边": 24}, "说明": "点任一节点可查看详情与相邻节点；工作 → 流程步骤 → 数据对象 → 相关数据表"}, "/api/work/detail|/api/work/detail?no=1": {"work": {"id": 1, "no": 1, "exam_type": "中级会计职称", "subject": "中级会计实务", "short_name": "账务核算", "detail": "1. 资产核算：存货、固定资产、无形资产、投资性房地产、长期股权投资、金融资产与金融负债、资产减值\n2. 负债权益：应付职工薪酬、借款费用、或有事项、债务重组、所有者权益、政府补助\n3. 损益核算：收入、所得税、非货币性资产交换、租赁\n4. 会计调整：会计政策 / 估计变更与差错更正、资产负债表日后事项、外币折算\n5. 报告与特殊主体：个别财务报表、合并财务报表、政府会计、民间非营利组织会计", "data_note": "数据从业务端采集，经会计加工后输出为标准化财务信息", "value_text": "通过权责发生制完整反映企业财务状况、经营成果与现金流量，为内部管理、纳税申报、外部融资提供基础财务数据，是财务价值的底层载体", "work_note": "企业账务核算的标准闭环流程", "created_at": "2026-11-08 10:37:49"}, "数据流": {"节点": [{"id": 1, "domain_no": 1, "seq": 1, "name": "原始业务单据（发票、出入库单、合同等）", "system_object": "业务单据 / 发票台账", "note": null}, {"id": 2, "domain_no": 1, "seq": 2, "name": "记账凭证", "system_object": "记账凭证", "note": null}, {"id": 3, "domain_no": 1, "seq": 3, "name": "明细分类账", "system_object": "业务数据", "note": null}, {"id": 4, "domain_no": 1, "seq": 4, "name": "总分类账", "system_object": "业务数据", "note": null}, {"id": 5, "domain_no": 1, "seq": 5, "name": "科目余额表", "system_object": "明细账 / 总账 / 科目余额表", "note": null}, {"id": 6, "domain_no": 1, "seq": 6, "name": "单体 / 合并财务报表", "system_object": "三大财务报表", "note": null}], "说明": "数据从业务端采集，经会计加工后输出为标准化财务信息"}, "价值流": {"主张": "通过权责发生制完整反映企业财务状况、经营成果与现金流量，为内部管理、纳税申报、外部融资提供基础财务数据，是财务价值的底层载体", "价值点": ["通过权责发生制完整反映企业财务状况", "经营成果与现金流量", "为内部管理", "纳税申报", "外部融资提供基础财务数据", "是财务价值的底层载体"]}, "工作流": {"步骤": [{"id": 1, "domain_no": 1, "seq": 1, "name": "业务单据收集", "system_entry": "业务单据", "system_page": "docs", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "原始业务单据（发票、出入库单、合同等）", "数据对象": "业务单据 / 发票台账", "执行动作": "编制会计分录", "动作入口": "vouchers", "系统入口": "docs", "系统功能": "业务单据", "关联覆盖": "已支撑"}, {"id": 2, "domain_no": 1, "seq": 2, "name": "制单录入", "system_entry": "凭证管理", "system_page": "vouchers", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "记账凭证", "数据对象": "记账凭证", "执行动作": "计提折旧 / 摊销 / 减值", "动作入口": "periods", "系统入口": "vouchers", "系统功能": "凭证管理", "关联覆盖": "已支撑"}, {"id": 3, "domain_no": 1, "seq": 3, "name": "凭证审核", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "明细分类账", "数据对象": "业务数据", "执行动作": "结转成本损益", "动作入口": "periods", "系统入口": "vouchers", "系统功能": "审批与合规检查", "关联覆盖": "已支撑"}, {"id": 4, "domain_no": 1, "seq": 4, "name": "记账过账", "system_entry": "凭证过账", "system_page": "vouchers", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "总分类账", "数据对象": "业务数据", "执行动作": "对账调账", "动作入口": "recon", "系统入口": "vouchers", "系统功能": "凭证过账", "关联覆盖": "已支撑"}, {"id": 5, "domain_no": 1, "seq": 5, "name": "期末计提 / 摊销 / 结转", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "科目余额表", "数据对象": "明细账 / 总账 / 科目余额表", "执行动作": "编制三大报表", "动作入口": "search", "系统入口": "periods", "系统功能": "期末结账与调整", "关联覆盖": "待建"}, {"id": 6, "domain_no": 1, "seq": 6, "name": "对账", "system_entry": "对账与函证", "system_page": "recon", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "单体 / 合并财务报表", "数据对象": "三大财务报表", "执行动作": "合并报表抵消分录编制", "动作入口": "competency_center", "系统入口": "recon", "系统功能": "对账与函证", "关联覆盖": "待建"}, {"id": 7, "domain_no": 1, "seq": 7, "name": "结账", "system_entry": "结账与归档", "system_page": "periods", "coverage": "部分支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "单体 / 合并财务报表", "数据对象": "三大财务报表", "执行动作": "纳税调整基础核算", "动作入口": "periods", "系统入口": "periods", "系统功能": "结账与归档", "关联覆盖": "已支撑"}, {"id": 8, "domain_no": 1, "seq": 8, "name": "财务报表编制", "system_entry": "财务报表", "system_page": "fin", "coverage": "已支撑", "note": "企业账务核算的标准闭环流程", "数据流产物": "单体 / 合并财务报表", "数据对象": "三大财务报表", "执行动作": "纳税调整基础核算", "动作入口": "periods", "系统入口": "fin", "系统功能": "财务报表", "关联覆盖": "已支撑"}], "说明": "企业账务核算的标准闭环流程"}, "执行流": {"动作": [{"id": 1, "domain_no": 1, "seq": 1, "name": "编制会计分录", "system_entry": "凭证管理", "system_page": "vouchers", "coverage": "已支撑", "note": "来自调研表执行流"}, {"id": 2, "domain_no": 1, "seq": 2, "name": "计提折旧 / 摊销 / 减值", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "来自调研表执行流"}, {"id": 3, "domain_no": 1, "seq": 3, "name": "结转成本损益", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "来自调研表执行流"}, {"id": 4, "domain_no": 1, "seq": 4, "name": "对账调账", "system_entry": "对账与函证", "system_page": "recon", "coverage": "已支撑", "note": "来自调研表执行流"}, {"id": 5, "domain_no": 1, "seq": 5, "name": "编制三大报表", "system_entry": "全局搜索", "system_page": "search", "coverage": "待建", "note": "来自调研表执行流"}, {"id": 6, "domain_no": 1, "seq": 6, "name": "合并报表抵消分录编制", "system_entry": "合并报表（待建）", "system_page": "competency_center", "coverage": "待建", "note": "来自调研表执行流"}, {"id": 7, "domain_no": 1, "seq": 7, "name": "纳税调整基础核算", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "来自调研表执行流"}]}, "子科目": "1. 资产核算：存货、固定资产、无形资产、投资性房地产、长期股权投资、金融资产与金融负债、资产减值\n2. 负债权益：应付职工薪酬、借款费用、或有事项、债务重组、所有者权益、政府补助\n3. 损益核算：收入、所得税、非货币性资产交换、租赁\n4. 会计调整：会计政策 / 估计变更与差错更正、资产负债表日后事项、外币折算\n5. 报告与特殊主体：个别财务报表、合并财务报表、政府会计、民间非营利组织会计"}, "/api/work/seven/flows|/api/work/seven/flows?no=1": {"work": {"编号": 1, "考试类型": "中级会计职称", "科目": "中级会计实务", "简称": "账务核算", "子科目": "1. 资产核算：存货、固定资产、无形资产、投资性房地产、长期股权投资、金融资产、资产减值\n2. 负债权益：职工薪酬、借款费用、或有事项、债务重组、所有者权益\n3. 损益核算：收入、所得税、政府补助、非货币性资产交换、租赁\n4. 会计调整：政策 / 估计变更、差错更正、日后事项、外币折算\n5. 报告披露：个别报表、合并报表、每股收益、公允价值计量\n6. 特殊主体：政府会计、民间非营利组织会计"}, "七流": {"数据流": {"节点": [{"id": 1, "domain_no": 1, "flow": "数据流", "seq": 1, "name": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据", "system_entry": "业务单据", "system_page": "docs", "coverage": "已支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 2, "domain_no": 1, "flow": "数据流", "seq": 2, "name": "ERP / 财务系统录入同步", "system_entry": "数据流对应功能", "system_page": "books", "coverage": "部分支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 3, "domain_no": 1, "flow": "数据流", "seq": 3, "name": "明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据", "system_entry": "账簿与余额表", "system_page": "books", "coverage": "已支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 4, "domain_no": 1, "flow": "数据流", "seq": 4, "name": "总账科目汇总", "system_entry": "数据流对应功能", "system_page": "books", "coverage": "部分支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 5, "domain_no": 1, "flow": "数据流", "seq": 5, "name": "期末计提 / 摊销 / 减值 / 结转数据", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 6, "domain_no": 1, "flow": "数据流", "seq": 6, "name": "对账调差数据", "system_entry": "对账与函证", "system_page": "recon", "coverage": "已支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 7, "domain_no": 1, "flow": "数据流", "seq": 7, "name": "单体报表数据", "system_entry": "财务报表", "system_page": "fin", "coverage": "已支撑", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 8, "domain_no": 1, "flow": "数据流", "seq": 8, "name": "合并抵消调整数据", "system_entry": "合并报表（待建）", "system_page": "competency_center", "coverage": "待建", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}, {"id": 9, "domain_no": 1, "flow": "数据流", "seq": 9, "name": "合并报表及附注数据", "system_entry": "合并报表（待建）", "system_page": "competency_center", "coverage": "待建", "note": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转"}], "原文": "采购发票 / 出入库单 / 资产验收单 / 投资协议 / 借款合同 / 销售合同等原始单据→ERP / 财务系统录入同步→明细分类账（资产 / 负债 / 损益等 20 + 科目）核算数据→总账科目汇总→期末计提 / 摊销 / 减值 / 结转数据→对账调差数据→单体报表数据→合并抵消调整数据→合并报表及附注数据", "系统入口": "books", "节点数": 9}, "资金流": {"节点": [{"id": 10, "domain_no": 1, "flow": "资金流", "seq": 1, "name": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令", "system_entry": "资金流对应功能", "system_page": "journal", "coverage": "部分支撑", "note": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报"}, {"id": 11, "domain_no": 1, "flow": "资金流", "seq": 2, "name": "网银 / 银企直连划转", "system_entry": "外部协同", "system_page": "gateway_center", "coverage": "已支撑", "note": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报"}, {"id": 12, "domain_no": 1, "flow": "资金流", "seq": 3, "name": "资金日记账流水", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报"}, {"id": 13, "domain_no": 1, "flow": "资金流", "seq": 4, "name": "银行账户余额核对", "system_entry": "资金流对应功能", "system_page": "journal", "coverage": "部分支撑", "note": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报"}, {"id": 14, "domain_no": 1, "flow": "资金流", "seq": 5, "name": "余额调节表", "system_entry": "资金流对应功能", "system_page": "journal", "coverage": "部分支撑", "note": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报"}, {"id": 15, "domain_no": 1, "flow": "资金流", "seq": 6, "name": "资金日报 / 月报", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报"}], "原文": "采购付款、销售收款、投资款投出 / 收回、融资款到账 / 偿还、薪酬发放、税费缴纳、费用报销等收付指令→网银 / 银企直连划转→资金日记账流水→银行账户余额核对→余额调节表→资金日报 / 月报", "系统入口": "journal", "节点数": 6}, "工作流": {"节点": [{"id": 16, "domain_no": 1, "flow": "工作流", "seq": 1, "name": "业务事项发生", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 17, "domain_no": 1, "flow": "工作流", "seq": 2, "name": "原始单据传递初审", "system_entry": "业务单据", "system_page": "docs", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 18, "domain_no": 1, "flow": "工作流", "seq": 3, "name": "财务制单", "system_entry": "凭证管理", "system_page": "vouchers", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 19, "domain_no": 1, "flow": "工作流", "seq": 4, "name": "凭证审核", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 20, "domain_no": 1, "flow": "工作流", "seq": 5, "name": "记账过账", "system_entry": "凭证过账", "system_page": "vouchers", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 21, "domain_no": 1, "flow": "工作流", "seq": 6, "name": "期末批量计提结转", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 22, "domain_no": 1, "flow": "工作流", "seq": 7, "name": "财产清查（监盘 / 盘点）", "system_entry": "对账与函证", "system_page": "recon", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 23, "domain_no": 1, "flow": "工作流", "seq": 8, "name": "账账 / 账实核对", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 24, "domain_no": 1, "flow": "工作流", "seq": 9, "name": "结账", "system_entry": "结账与归档", "system_page": "periods", "coverage": "部分支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 25, "domain_no": 1, "flow": "工作流", "seq": 10, "name": "单体报表", "system_entry": "财务报表", "system_page": "fin", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 26, "domain_no": 1, "flow": "工作流", "seq": 11, "name": "合并报表", "system_entry": "合并报表（待建）", "system_page": "competency_center", "coverage": "待建", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 27, "domain_no": 1, "flow": "工作流", "seq": 12, "name": "报表审核", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}, {"id": 28, "domain_no": 1, "flow": "工作流", "seq": 13, "name": "报送归档", "system_entry": "结账与归档", "system_page": "periods", "coverage": "部分支撑", "note": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档"}], "原文": "业务事项发生→原始单据传递初审→财务制单→凭证审核→记账过账→期末批量计提结转→财产清查（监盘 / 盘点）→账账 / 账实核对→结账→单体报表→合并报表→报表审核→报送归档", "系统入口": "dashboard", "节点数": 13}, "执行流": {"节点": [{"id": 29, "domain_no": 1, "flow": "执行流", "seq": 1, "name": "审核原始凭证真实合法完整", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 30, "domain_no": 1, "flow": "执行流", "seq": 2, "name": "编制全场景会计分录", "system_entry": "凭证管理", "system_page": "vouchers", "coverage": "已支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 31, "domain_no": 1, "flow": "执行流", "seq": 3, "name": "按月计提折旧 / 摊销 / 减值", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 32, "domain_no": 1, "flow": "执行流", "seq": 4, "name": "结转生产成本、销售成本与损益", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 33, "domain_no": 1, "flow": "执行流", "seq": 5, "name": "往来清账与账龄分析", "system_entry": "执行流对应功能", "system_page": "advanced_center", "coverage": "部分支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 34, "domain_no": 1, "flow": "执行流", "seq": 6, "name": "银行对账并编余额调节表", "system_entry": "对账与函证", "system_page": "recon", "coverage": "已支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 35, "domain_no": 1, "flow": "执行流", "seq": 7, "name": "编制合并抵消分录", "system_entry": "合并报表（待建）", "system_page": "competency_center", "coverage": "待建", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}, {"id": 36, "domain_no": 1, "flow": "执行流", "seq": 8, "name": "生成四大报表与附注", "system_entry": "财务报表", "system_page": "fin", "coverage": "已支撑", "note": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注"}], "原文": "审核原始凭证真实合法完整；编制全场景会计分录；按月计提折旧 / 摊销 / 减值；结转生产成本、销售成本与损益；往来清账与账龄分析；银行对账并编余额调节表；编制合并抵消分录；生成四大报表与附注", "系统入口": "advanced_center", "节点数": 8}, "管控流": {"节点": [{"id": 37, "domain_no": 1, "flow": "管控流", "seq": 1, "name": "不相容岗位分离（制单 / 审核、出纳 / 记账）", "system_entry": "凭证管理", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 38, "domain_no": 1, "flow": "管控流", "seq": 2, "name": "资金支付分级授权审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 39, "domain_no": 1, "flow": "管控流", "seq": 3, "name": "大额资产购置 / 处置审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 40, "domain_no": 1, "flow": "管控流", "seq": 4, "name": "减值计提与转回审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 41, "domain_no": 1, "flow": "管控流", "seq": 5, "name": "期末结账审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 42, "domain_no": 1, "flow": "管控流", "seq": 6, "name": "合并范围认定审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 43, "domain_no": 1, "flow": "管控流", "seq": 7, "name": "报表多级审核", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}, {"id": 44, "domain_no": 1, "flow": "管控流", "seq": 8, "name": "定期内部监盘", "system_entry": "对账与函证", "system_page": "recon", "coverage": "已支撑", "note": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘"}], "原文": "不相容岗位分离（制单 / 审核、出纳 / 记账）；资金支付分级授权审批；大额资产购置 / 处置审批；减值计提与转回审批；期末结账审批；合并范围认定审批；报表多级审核；定期内部监盘", "系统入口": "sec_center", "节点数": 8}, "价值流": {"节点": [{"id": 45, "domain_no": 1, "flow": "价值流", "seq": 1, "name": "业务原始信息", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}, {"id": 46, "domain_no": 1, "flow": "价值流", "seq": 2, "name": "标准化会计核算", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}, {"id": 47, "domain_no": 1, "flow": "价值流", "seq": 3, "name": "形成准确财务数据", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}, {"id": 48, "domain_no": 1, "flow": "价值流", "seq": 4, "name": "支撑纳税申报、银行融资、内部经营分析", "system_entry": "税务中心", "system_page": "tax_center", "coverage": "已支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}, {"id": 49, "domain_no": 1, "flow": "价值流", "seq": 5, "name": "保障财务信息公允可靠", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}, {"id": 50, "domain_no": 1, "flow": "价值流", "seq": 6, "name": "降低内外部信息不对称成本", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}, {"id": 51, "domain_no": 1, "flow": "价值流", "seq": 7, "name": "为经营决策提供基础数据底座", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座"}], "原文": "业务原始信息→标准化会计核算→形成准确财务数据→支撑纳税申报、银行融资、内部经营分析→保障财务信息公允可靠→降低内外部信息不对称成本→为经营决策提供基础数据底座", "系统入口": "analysis", "节点数": 7}, "合规流": {"节点": [{"id": 52, "domain_no": 1, "flow": "合规流", "seq": 1, "name": "会计处理匹配企业会计准则", "system_entry": "合规流对应功能", "system_page": "compliance", "coverage": "部分支撑", "note": "会计处理匹配企业会计准则；收入、减值、合并等核心事项符合准则规范；报表列报与附注符合披露要求；涉税核算符合税法规定；会计档案符合《会计档案管理办法》"}, {"id": 53, "domain_no": 1, "flow": "合规流", "seq": 2, "name": "收入、减值、合并等核心事项符合准则规范", "system_entry": "期末结账与调整", "system_page": "periods", "coverage": "已支撑", "note": "会计处理匹配企业会计准则；收入、减值、合并等核心事项符合准则规范；报表列报与附注符合披露要求；涉税核算符合税法规定；会计档案符合《会计档案管理办法》"}, {"id": 54, "domain_no": 1, "flow": "合规流", "seq": 3, "name": "报表列报与附注符合披露要求", "system_entry": "财务报表", "system_page": "fin", "coverage": "已支撑", "note": "会计处理匹配企业会计准则；收入、减值、合并等核心事项符合准则规范；报表列报与附注符合披露要求；涉税核算符合税法规定；会计档案符合《会计档案管理办法》"}, {"id": 55, "domain_no": 1, "flow": "合规流", "seq": 4, "name": "涉税核算符合税法规定", "system_entry": "税务中心", "system_page": "tax_center", "coverage": "已支撑", "note": "会计处理匹配企业会计准则；收入、减值、合并等核心事项符合准则规范；报表列报与附注符合披露要求；涉税核算符合税法规定；会计档案符合《会计档案管理办法》"}, {"id": 56, "domain_no": 1, "flow": "合规流", "seq": 5, "name": "会计档案符合《会计档案管理办法》", "system_entry": "合规流对应功能", "system_page": "compliance", "coverage": "部分支撑", "note": "会计处理匹配企业会计准则；收入、减值、合并等核心事项符合准则规范；报表列报与附注符合披露要求；涉税核算符合税法规定；会计档案符合《会计档案管理办法》"}], "原文": "会计处理匹配企业会计准则；收入、减值、合并等核心事项符合准则规范；报表列报与附注符合披露要求；涉税核算符合税法规定；会计档案符合《会计档案管理办法》", "系统入口": "compliance", "节点数": 5}}, "流名": ["数据流", "资金流", "工作流", "执行流", "管控流", "价值流", "合规流"]}, "/api/reports/overview|/api/reports/overview": {"month": "2026-11", "cash_balance": 2838.5, "bank_balance": 141540.0, "income": 81738.5, "expense": 22660.0, "entries": 10, "pending_docs": 1, "pending_vouchers": 1, "unchecked": 10}, "/api/reports/monthly|/api/reports/monthly": {"items": [{"period": "2026-09", "income": 18000.0, "expense": 0, "cnt": 1}, {"period": "2026-10", "income": 30000.0, "expense": 9200.0, "cnt": 2}, {"period": "2026-11", "income": 81738.5, "expense": 22660.0, "cnt": 10}]}, "/api/work/seven/role|/api/work/seven/role?no=1": {"岗位": {"id": 1, "no": 1, "name": "财务核算类", "posts": "应收应付会计、成本会计、总账会计、合并报表会计、核算主管", "exam_subjects": "1. 中级会计实务\n2. CPA 会计\n3. 高级会计实务（核算与合并模块）", "knowledge": "1. 中级：存货 / 固资 / 无形等基础资产核算、日常损益核算、单体报表编制、基础合并报表\n2. CPA：长投与合营安排、金融工具、收入五步法、所得税会计、租赁准则、多层级合并报表、特殊交易核算、报表附注披露\n3. 高会：集团复杂合并、套期会计、股权激励会计、反向购买等特殊业务", "value_text": "输出准确、合规的标准化财务核算数据，为纳税申报、银行融资、内部经营分析提供可靠数据底座，保障财务信息真实性与可追溯性", "created_at": "2026-11-08 10:49:08"}, "七流": {"数据流": ["原始单据采集校验", "凭证录入生成", "明细账 / 总账归集", "科目余额汇总", "期末调整数据", "单体报表输出", "合并抵消调整", "合并报表与附注生成"], "资金流": ["收付款单据账务匹配、银行流水对账核销、往来资金清账、固定资产 / 存货资金账实核对、税费计提账务匹配"], "工作流": ["业务单据初审", "财务制单", "凭证审核", "记账过账", "期末计提 / 摊销 / 结转", "财产清查", "账账 / 账实核对", "结账", "报表编制与审核"], "执行流": ["编制全场景记账凭证", "按月计提折旧 / 摊销 / 减值", "结转生产成本与销售成本", "往来账龄分析与清账", "编制银行存款余额调节表", "编制单体 / 合并财务报表及附注"], "管控流": ["不相容岗位分离（制单 / 审核、出纳 / 记账）", "凭证二级审核", "期末结账审批", "大额资产处置审批", "减值计提审批", "定期存货 / 固定资产监盘", "合并范围认定审核"], "价值流": ["输出准确、合规的标准化财务核算数据，为纳税申报、银行融资、内部经营分析提供可靠数据底座，保障财务信息真实性与可追溯性"], "合规流": ["严格遵循《企业会计准则》", "会计档案符合《会计档案管理办法》", "核算口径符合公司财务制度", "涉税核算匹配税法要求"]}, "能力进阶": [{"级别": "初级", "要求": "初级：往来 / 成本会计（掌握中级会计实务基础章节）"}, {"级别": "中级", "要求": "中级：总账 / 核算主管（精通中级会计实务全册）"}, {"级别": "高阶", "要求": "高阶：合并报表 / 核算专家（精通 CPA 会计全章节）"}], "关联工作": [{"编号": 1, "简称": "账务核算", "科目": "中级会计实务"}, {"编号": 5, "简称": "准则核算", "科目": "会计"}, {"编号": 6, "简称": "审计鉴证", "科目": "审计"}]}, "/api/work/seven/role|/api/work/seven/role?no=2": {"岗位": {"id": 2, "no": 2, "name": "审计类", "posts": "外部审计师（事务所）、内部审计师、内控专员、审计主管、风控专员", "exam_subjects": "1. CPA 审计\n2. 中级经济法 / CPA 经济法\n3. 高级会计实务（内控与风险管理模块）", "knowledge": "1. CPA 审计：风险评估与应对、四大循环审计、审计抽样、信息技术审计、集团审计、特殊项目审计、审计报告、内控审计、质量管理与独立性\n2. 经济法：公司治理、合同合规、票据合规、证券合规\n3. 高会：内控体系搭建、全面风险管理、内控评价与审计", "value_text": "第三方鉴证财务报表公允性，降低资本市场信息不对称；识别企业内控缺陷与经营风险；防范舞弊风险；提升财务信息公信力与企业信用价值", "created_at": "2026-11-08 10:49:08"}, "七流": {"数据流": ["被审计单位财务 / 业务数据采集", "风险评估分析", "审计证据归集校验", "审计工作底稿编制", "问题汇总与确认", "审计结论输出", "整改跟踪数据"], "资金流": ["货币资金监盘、银行函证回函核验、大额资金流水核查、收支截止测试、资金内控有效性验证、舞弊资金流向追踪"], "工作流": ["审计立项 / 业务承接", "制定审计策略与计划", "风险评估程序", "执行进一步审计程序", "特殊事项核查", "问题沟通确认", "出具审计报告", "整改跟踪闭环"], "执行流": ["设计风险评估与实质性程序", "执行函证、监盘、穿行测试", "编制标准化审计工作底稿", "识别重大错报风险与内控缺陷", "出具标准 / 非标准审计报告", "跟踪整改落地"], "管控流": ["审计独立性管控", "工作底稿三级复核", "审计计划逐级审批", "重大问题专项上报", "整改闭环管控", "事务所质量管理体系约束"], "价值流": ["第三方鉴证财务报表公允性，降低资本市场信息不对称；识别企业内控缺陷与经营风险；防范舞弊风险；提升财务信息公信力与企业信用价值"], "合规流": ["外审遵循《注册会计师审计准则》", "内审遵循《内部审计准则》", "内控符合《企业内部控制基本规范》", "恪守职业道德与独立性要求"]}, "能力进阶": [{"级别": "初级", "要求": "初级：审计助理（掌握审计基础流程与程序）"}, {"级别": "中级", "要求": "中级：项目经理 / 内审主管（精通 CPA 审计全流程）"}, {"级别": "高阶", "要求": "高阶：审计经理 / 内控负责人（掌握高会内控体系 + CPA 综合能力）"}], "关联工作": [{"编号": 3, "简称": "合同法务（中级）", "科目": "经济法"}, {"编号": 7, "简称": "成本与估值", "科目": "财务成本管理"}]}, "/api/work/seven/flows|/api/work/seven/flows?no=2": {"work": {"编号": 2, "考试类型": "中级会计职称", "科目": "财务管理", "简称": "财务与预算", "子科目": "1. 基础工具：货币时间价值、风险与收益、成本性态\n2. 预算管理：预算编制方法、经营预算、财务预算\n3. 筹资管理：筹资方式、资本成本、杠杆效应、资本结构\n4. 投资管理：项目投资、证券投资、基金投资\n5. 营运管理：现金、应收账款、存货、流动负债\n6. 成本管理：本量利分析、标准成本、作业成本、责任成本\n7. 评价分配：收入分配、财务分析、杜邦分析、绩效评价"}, "七流": {"数据流": {"节点": [{"id": 57, "domain_no": 2, "flow": "数据流", "seq": 1, "name": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）", "system_entry": "财务报表", "system_page": "fin", "coverage": "已支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}, {"id": 58, "domain_no": 2, "flow": "数据流", "seq": 2, "name": "财务指标计算数据", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}, {"id": 59, "domain_no": 2, "flow": "数据流", "seq": 3, "name": "预算编制与执行数据", "system_entry": "预算与差异分析", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}, {"id": 60, "domain_no": 2, "flow": "数据流", "seq": 4, "name": "投融资项目测算数据", "system_entry": "数据流对应功能", "system_page": "books", "coverage": "部分支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}, {"id": 61, "domain_no": 2, "flow": "数据流", "seq": 5, "name": "成本核算与差异数据", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}, {"id": 62, "domain_no": 2, "flow": "数据流", "seq": 6, "name": "营运资金周转数据", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}, {"id": 63, "domain_no": 2, "flow": "数据流", "seq": 7, "name": "绩效评价指标数据", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据"}], "原文": "财务报表核算数据 + 业务经营数据（销量 / 产能 / 采购量）→财务指标计算数据→预算编制与执行数据→投融资项目测算数据→成本核算与差异数据→营运资金周转数据→绩效评价指标数据", "系统入口": "books", "节点数": 7}, "资金流": {"节点": [{"id": 64, "domain_no": 2, "flow": "资金流", "seq": 1, "name": "资金需求预测", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}, {"id": 65, "domain_no": 2, "flow": "资金流", "seq": 2, "name": "筹资方案资金到账", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}, {"id": 66, "domain_no": 2, "flow": "资金流", "seq": 3, "name": "项目投资资金拨付", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}, {"id": 67, "domain_no": 2, "flow": "资金流", "seq": 4, "name": "营运资金循环调度", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}, {"id": 68, "domain_no": 2, "flow": "资金流", "seq": 5, "name": "股利分配资金划出", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}, {"id": 69, "domain_no": 2, "flow": "资金流", "seq": 6, "name": "资金使用效率监控", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}, {"id": 70, "domain_no": 2, "flow": "资金流", "seq": 7, "name": "公司资金余缺调剂", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂"}], "原文": "资金需求预测→筹资方案资金到账→项目投资资金拨付→营运资金循环调度→股利分配资金划出→资金使用效率监控→公司资金余缺调剂", "系统入口": "journal", "节点数": 7}, "工作流": {"节点": [{"id": 71, "domain_no": 2, "flow": "工作流", "seq": 1, "name": "财务预测", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 72, "domain_no": 2, "flow": "工作流", "seq": 2, "name": "预算编制", "system_entry": "预算与差异分析", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 73, "domain_no": 2, "flow": "工作流", "seq": 3, "name": "预算审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 74, "domain_no": 2, "flow": "工作流", "seq": 4, "name": "执行监控", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 75, "domain_no": 2, "flow": "工作流", "seq": 5, "name": "差异分析", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 76, "domain_no": 2, "flow": "工作流", "seq": 6, "name": "方案优化", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 77, "domain_no": 2, "flow": "工作流", "seq": 7, "name": "投融资立项", "system_entry": "重大项目（部分待建）", "system_page": "competency_center", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 78, "domain_no": 2, "flow": "工作流", "seq": 8, "name": "测算", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 79, "domain_no": 2, "flow": "工作流", "seq": 9, "name": "评审", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 80, "domain_no": 2, "flow": "工作流", "seq": 10, "name": "决策", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 81, "domain_no": 2, "flow": "工作流", "seq": 11, "name": "执行", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 82, "domain_no": 2, "flow": "工作流", "seq": 12, "name": "复盘", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 83, "domain_no": 2, "flow": "工作流", "seq": 13, "name": "成本核算", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 84, "domain_no": 2, "flow": "工作流", "seq": 14, "name": "分析", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 85, "domain_no": 2, "flow": "工作流", "seq": 15, "name": "管控", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}, {"id": 86, "domain_no": 2, "flow": "工作流", "seq": 16, "name": "考核", "system_entry": "工作流对应功能", "system_page": "dashboard", "coverage": "部分支撑", "note": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核"}], "原文": "财务预测→预算编制→预算审批→执行监控→差异分析→方案优化；投融资立项→测算→评审→决策→执行→复盘；成本核算→分析→管控→考核", "系统入口": "dashboard", "节点数": 16}, "执行流": {"节点": [{"id": 87, "domain_no": 2, "flow": "执行流", "seq": 1, "name": "编制销售 / 生产 / 费用 / 财务全面预算", "system_entry": "预算与差异分析", "system_page": "advanced_center", "coverage": "已支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}, {"id": 88, "domain_no": 2, "flow": "执行流", "seq": 2, "name": "测算资本成本、NPV、IRR、投资回收期", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}, {"id": 89, "domain_no": 2, "flow": "执行流", "seq": 3, "name": "制定信用政策与最优存货批量模型", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}, {"id": 90, "domain_no": 2, "flow": "执行流", "seq": 4, "name": "开展本量利与成本差异分析", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}, {"id": 91, "domain_no": 2, "flow": "执行流", "seq": 5, "name": "搭建杜邦分析体系", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}, {"id": 92, "domain_no": 2, "flow": "执行流", "seq": 6, "name": "测算股利方案", "system_entry": "执行流对应功能", "system_page": "advanced_center", "coverage": "部分支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}, {"id": 93, "domain_no": 2, "flow": "执行流", "seq": 7, "name": "撰写财务分析报告", "system_entry": "执行流对应功能", "system_page": "advanced_center", "coverage": "部分支撑", "note": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告"}], "原文": "编制销售 / 生产 / 费用 / 财务全面预算；测算资本成本、NPV、IRR、投资回收期；制定信用政策与最优存货批量模型；开展本量利与成本差异分析；搭建杜邦分析体系；测算股利方案；撰写财务分析报告", "系统入口": "advanced_center", "节点数": 7}, "管控流": {"节点": [{"id": 94, "domain_no": 2, "flow": "管控流", "seq": 1, "name": "预算执行刚性管控", "system_entry": "管控流对应功能", "system_page": "sec_center", "coverage": "部分支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}, {"id": 95, "domain_no": 2, "flow": "管控流", "seq": 2, "name": "投融资项目分级审批", "system_entry": "审批与合规检查", "system_page": "vouchers", "coverage": "已支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}, {"id": 96, "domain_no": 2, "flow": "管控流", "seq": 3, "name": "重大投资集体决策", "system_entry": "管控流对应功能", "system_page": "sec_center", "coverage": "部分支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}, {"id": 97, "domain_no": 2, "flow": "管控流", "seq": 4, "name": "成本费用定额管控", "system_entry": "管控流对应功能", "system_page": "sec_center", "coverage": "部分支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}, {"id": 98, "domain_no": 2, "flow": "管控流", "seq": 5, "name": "绩效指标刚性考核", "system_entry": "管控流对应功能", "system_page": "sec_center", "coverage": "部分支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}, {"id": 99, "domain_no": 2, "flow": "管控流", "seq": 6, "name": "资金使用额度管控", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}, {"id": 100, "domain_no": 2, "flow": "管控流", "seq": 7, "name": "财务分析定期汇报机制", "system_entry": "管控流对应功能", "system_page": "sec_center", "coverage": "部分支撑", "note": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制"}], "原文": "预算执行刚性管控；投融资项目分级审批；重大投资集体决策；成本费用定额管控；绩效指标刚性考核；资金使用额度管控；财务分析定期汇报机制", "系统入口": "sec_center", "节点数": 7}, "价值流": {"节点": [{"id": 101, "domain_no": 2, "flow": "价值流", "seq": 1, "name": "基础财务数据", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}, {"id": 102, "domain_no": 2, "flow": "价值流", "seq": 2, "name": "量化分析加工", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}, {"id": 103, "domain_no": 2, "flow": "价值流", "seq": 3, "name": "形成决策支撑信息", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}, {"id": 104, "domain_no": 2, "flow": "价值流", "seq": 4, "name": "优化资本结构与资金效率", "system_entry": "资金与营运", "system_page": "cashier_tools", "coverage": "已支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}, {"id": 105, "domain_no": 2, "flow": "价值流", "seq": 5, "name": "降低成本费用", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}, {"id": 106, "domain_no": 2, "flow": "价值流", "seq": 6, "name": "提升投资回报率", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}, {"id": 107, "domain_no": 2, "flow": "价值流", "seq": 7, "name": "驱动企业盈利增长与价值提升", "system_entry": "价值流对应功能", "system_page": "analysis", "coverage": "部分支撑", "note": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升"}], "原文": "基础财务数据→量化分析加工→形成决策支撑信息→优化资本结构与资金效率→降低成本费用→提升投资回报率→驱动企业盈利增长与价值提升", "系统入口": "analysis", "节点数": 7}, "合规流": {"节点": [{"id": 108, "domain_no": 2, "flow": "合规流", "seq": 1, "name": "预算编制符合公司管理制度", "system_entry": "预算与差异分析", "system_page": "advanced_center", "coverage": "已支撑", "note": "预算编制符合公司管理制度；投融资决策符合公司章程与监管要求；成本核算符合会计准则与公司制度；绩效评价符合公司考核办法；数据来源合规可追溯"}, {"id": 109, "domain_no": 2, "flow": "合规流", "seq": 2, "name": "投融资决策符合公司章程与监管要求", "system_entry": "法务管理", "system_page": "legal_center", "coverage": "已支撑", "note": "预算编制符合公司管理制度；投融资决策符合公司章程与监管要求；成本核算符合会计准则与公司制度；绩效评价符合公司考核办法；数据来源合规可追溯"}, {"id": 110, "domain_no": 2, "flow": "合规流", "seq": 3, "name": "成本核算符合会计准则与公司制度", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "预算编制符合公司管理制度；投融资决策符合公司章程与监管要求；成本核算符合会计准则与公司制度；绩效评价符合公司考核办法；数据来源合规可追溯"}, {"id": 111, "domain_no": 2, "flow": "合规流", "seq": 4, "name": "绩效评价符合公司考核办法", "system_entry": "高阶核算与决策模型", "system_page": "advanced_center", "coverage": "已支撑", "note": "预算编制符合公司管理制度；投融资决策符合公司章程与监管要求；成本核算符合会计准则与公司制度；绩效评价符合公司考核办法；数据来源合规可追溯"}, {"id": 112, "domain_no": 2, "flow": "合规流", "seq": 5, "name": "数据来源合规可追溯", "system_entry": "合规流对应功能", "system_page": "compliance", "coverage": "部分支撑", "note": "预算编制符合公司管理制度；投融资决策符合公司章程与监管要求；成本核算符合会计准则与公司制度；绩效评价符合公司考核办法；数据来源合规可追溯"}], "原文": "预算编制符合公司管理制度；投融资决策符合公司章程与监管要求；成本核算符合会计准则与公司制度；绩效评价符合公司考核办法；数据来源合规可追溯", "系统入口": "compliance", "节点数": 5}}, "流名": ["数据流", "资金流", "工作流", "执行流", "管控流", "价值流", "合规流"]}};
const fetch = async (u,opt)=>{ const base=u.split('?')[0];
  let matched=false;
  for(const k in REAL){ if(k.startsWith(base+'|')||k===base) return {ok:true,json:async()=>REAL[k]}; }
  console.log('FETCH_MISS:',base);
  return {ok:false,json:async()=>({error:'404 '}),status:404}; };
/*==core==*/
/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* 会计出纳全流程系统 - 前端 SPA（仅通过 REST API 与后端交互） */
const $ = id => document.getElementById(id);
const S = { meta: null, page: 'dashboard', charts: [], filters: {}, timer: null };
const money = n => (Number(n) || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const actor = () => $('actor').value || '系统';
const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);

async function api(path, method = 'GET', body) {
  const opt = { method, headers: {} };
  if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch(path, opt);
  let data;
  try { data = await r.json(); } catch (e) { throw new Error('服务端返回异常'); }
  if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
  // 统一联动：任何写操作只要后端返回影响链，就提示它改动了哪些下游分析
  if (method !== 'GET' && data && data.impacts) showImpacts(data.impacts);
  return data;
}
function toast(msg, ms = 2400) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), ms);
}
function openModal(title, body, submitLabel, onSubmit) {
  $('modal').innerHTML = `<h3>${title}</h3><form id="modalForm">${body}
    <div class="actions"><button type="button" class="btn btn-g" onclick="closeModal()">取消</button>
    <button type="submit" class="btn btn-p">${submitLabel}</button></div></form>`;
  $('modalMask').classList.add('show');
  $('modalForm').onsubmit = async e => { e.preventDefault(); try { await onSubmit(e.target); } catch (err) { toast('✗ ' + err.message, 3500); } };
}
function closeModal() { $('modalMask').classList.remove('show'); }
$('modalMask').addEventListener('click', e => { if (e.target === $('modalMask')) closeModal(); });
const fd = (f, n) => (f.elements[n] ? f.elements[n].value.trim() : '');
const fnum = (f, n) => parseFloat(fd(f, n)) || 0;

/* ---------- 基础选项 ---------- */
const subjOpts = (v = '') => '<option value="">—请选择—</option>' + S.meta.subjects.map(s =>
  `<option value="${s.code}" ${v === s.code ? 'selected' : ''}>${s.code} ${esc(s.name)}</option>`).join('');
const projOpts = (v = '') => '<option value="">—无—</option>' + S.meta.projects.map(p =>
  `<option value="${p.id}" ${String(v) === String(p.id) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
const cpOpts = (v = '') => '<option value="">—无—</option>' + S.meta.counterparties.map(c =>
  `<option value="${c.id}" ${String(v) === String(c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
const bankOpts = (v = '') => S.meta.bank_accounts.map(b =>
  `<option value="${b.id}" ${String(v) === String(b.id) ? 'selected' : ''}>${esc(b.name)}</option>`).join('');
const statusTag = s => `<span class="tag t-${s}">${({ draft: '草稿', submitted: '待审批', approved: '已审批', rejected: '已驳回', settled: '已结算', cleared: '已核销', posted: '已过账', void: '已作废', open: '已开放', closed: '已结账' })[s] || s}</span>`;
const DOC_LABEL = { payment: '付款申请', receipt: '收款单', advance: '备用金借款', reimbursement: '费用报销' };

function destroyCharts() { S.charts.forEach(c => { try { c.destroy(); } catch (e) {} }); S.charts = []; }
function chart(id, cfg) {
  if (typeof Chart === 'undefined') { const el = $(id); if (el) el.parentElement.innerHTML = '<div class="empty">图表组件需要联网加载</div>'; return; }
  const c = new Chart($(id), cfg); S.charts.push(c); return c;
}
function table(rows, cols, emptyText = '暂无数据') {
  if (!rows.length) return `<div class="empty">${emptyText}</div>`;
  return `<div class="scroll"><table><thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''}">${c.t}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.f(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

/* Office 导入导出快捷方法 */
function exportExcel(...tables) { window.location.href = '/api/export/workbook.xlsx?tables=' + tables.join(','); }
function exportOffice(kind) { window.location.href = '/api/export/report.' + kind; }
function template(target) { window.location.href = '/api/export/template.xlsx?target=' + target; }
const EXPORT_BTN = (label, ...tables) => `<button class="btn btn-g" onclick="exportExcel(${tables.map(t => `'${t}'`).join(',')})">⬇ ${label}</button>`;


/*==pages_base==*/
/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* ================= 页面 ================= */
const PAGES = {
  dashboard: async () => {
    const [o, monthly, subjects, audit] = await Promise.all([
      api('/api/reports/overview'), api('/api/reports/monthly'), api('/api/reports/subjects'), api('/api/audit')]);
    return `<div class="banner">架构：前端 SPA（/app.js）↔ REST API（/api/*）↔ SQLite 数据库（data/journal.db）；
      业务链路：业务单据 → 审批 → 自动生成凭证 → 过账登记日记账 → 日结核对 / 银行对账 → 月末结账。</div>
      <div class="kpis">
        <div class="kpi"><div class="label">现金账面余额</div><div class="value" style="color:var(--primary-dark)">¥ ${money(o.cash_balance)}</div></div>
        <div class="kpi"><div class="label">银行账面余额</div><div class="value" style="color:var(--green)">¥ ${money(o.bank_balance)}</div></div>
        <div class="kpi"><div class="label">${o.month} 收入</div><div class="value" style="color:var(--primary)">¥ ${money(o.income)}</div></div>
        <div class="kpi"><div class="label">${o.month} 支出</div><div class="value" style="color:var(--orange)">¥ ${money(o.expense)}</div></div>
        <div class="kpi"><div class="label">待审批单据</div><div class="value">${o.pending_docs}</div></div>
        <div class="kpi"><div class="label">待过账凭证</div><div class="value">${o.pending_vouchers}</div></div>
        <div class="kpi"><div class="label">未核对流水</div><div class="value" style="color:var(--red)">${o.unchecked}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>各月收入 / 支出</h3><div class="chart-box"><canvas id="c1"></canvas></div></div>
        <div class="card"><h3>科目发生额（借方）</h3><div class="chart-box"><canvas id="c2"></canvas></div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>最近业务动态 <span class="muted">审计留痕</span></h3>
          ${table(audit.items.slice(0, 8), [
            { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
            { t: '操作', f: r => esc(r.action) },
            { t: '对象', f: r => esc(r.entity) },
            { t: '说明', f: r => `<span class="muted">${esc(r.detail)}</span>` },
          ])}</div>
        <div class="card"><h3>快捷入口</h3>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <button class="btn btn-p" onclick="newDoc()">＋ 新建业务单据</button>
            <button class="btn btn-g" onclick="go('vouchers')">凭证管理</button>
            <button class="btn btn-g" onclick="go('journal')">登记日记账</button>
            <button class="btn btn-g" onclick="go('daily')">日结核对</button>
            <button class="btn btn-g" onclick="go('recon')">银行对账</button>
            <button class="btn btn-g" onclick="go('reports')">报表中心</button>
            <button class="btn btn-p" style="background:var(--green)" onclick="exportPortable()">📦 一键打包换电脑</button>
          </div>
          <div style="margin-top:14px">
            <div class="stat-line"><span>数据库迁移版本</span><b>${S.meta.migrations.map(m => m.version).join(' → ')}</b></div>
            <div class="stat-line"><span>数据库文件</span><b>${esc(S.meta.database)}</b></div>
            <div class="stat-line"><span>会计期间</span><b>${S.meta.periods.map(p => p.period + ' ' + (p.status === 'open' ? '开放' : '结账')).join('、')}</b></div>
          </div>
        </div>
      </div>`;
  },

  docs: async () => {
    const d = await api('/api/docs');
    const typ = S.filters.fDocType || '', st = S.filters.fDocStatus || '';
    const rows = d.items.filter(x => (!typ || x.doc_type === typ) && (!st || x.status === st));
    return `<div class="page-head"><div><h2>业务单据</h2><div class="hint">付款申请 / 收款单 / 备用金借款 / 费用报销 · 草稿 → 提交 → 审批 → 出纳结算</div></div>
      ${EXPORT_BTN('导出 Excel', 'docs')}<button class="btn btn-p" onclick="newDoc()">＋ 新建单据</button></div>
      <div class="card"><div class="toolbar">
        <div><label>单据类型</label><select id="fDocType" onchange="render()">
          <option value="">全部</option>${Object.entries(DOC_LABEL).map(([k, v]) => `<option value="${k}" ${typ === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label>状态</label><select id="fDocStatus" onchange="render()">
          <option value="">全部</option>${['draft', 'submitted', 'approved', 'rejected', 'settled', 'cleared'].map(x => `<option value="${x}" ${st === x ? 'selected' : ''}>${({ draft: '草稿', submitted: '待审批', approved: '已审批', rejected: '已驳回', settled: '已结算', cleared: '已核销' })[x]}</option>`).join('')}</select></div>
      </div>
      ${table(rows, [
        { t: '单据号', f: r => `<b>${esc(r.doc_no)}</b>` },
        { t: '类型', f: r => DOC_LABEL[r.doc_type] || r.doc_type },
        { t: '日期', f: r => esc(r.doc_date) },
        { t: '金额', num: true, f: r => `<b>¥ ${money(r.amount)}</b>` },
        { t: '账户', f: r => r.account_kind === 'cash' ? '库存现金' : '银行存款' },
        { t: '对方科目', f: r => esc(r.subject_name || r.subject_code) },
        { t: '项目', f: r => esc(r.project_name || '—') },
        { t: '申请人', f: r => esc(r.applicant || '—') },
        { t: '事由', f: r => `<span class="muted">${esc(r.reason || '—')}</span>` },
        { t: '状态', f: r => statusTag(r.status) },
        { t: '凭证', f: r => esc(r.voucher_no || '—') },
        { t: '操作', f: r => {
            const b = (a, label, cls = 'btn-g') => `<button class="btn ${cls} btn-sm" onclick="actDoc(${r.id},'${a}')">${label}</button>`;
            if (r.status === 'draft') return b('submit', '提交') + b('delete', '删除', 'btn-r');
            if (r.status === 'submitted') return b('approve', '审批通过') + b('reject', '驳回', 'btn-r');
            if (r.status === 'approved') return b('settle', '办理收付款', 'btn-p');
            return '<span class="muted">已完成</span>';
          } },
      ], '没有符合条件的单据')}</div>`;
  },

  vouchers: async () => {
    const d = await api('/api/vouchers');
    return `<div class="page-head"><div><h2>凭证管理</h2><div class="hint">借贷复式记账 · 审核过账后自动登记现金/银行日记账</div></div>
      ${EXPORT_BTN('导出 Excel', 'vouchers', 'voucher_lines')}<button class="btn btn-p" onclick="newVoucher()">＋ 新增凭证</button></div>
      <div class="card">${table(d.items, [
        { t: '凭证号', f: r => `<b>${esc(r.voucher_no)}</b>` },
        { t: '日期', f: r => esc(r.voucher_date) },
        { t: '字', f: r => esc(r.voucher_type) },
        { t: '摘要', f: r => esc(r.summary) },
        { t: '分录', num: true, f: r => r.line_count },
        { t: '借方合计', num: true, f: r => money(r.lines.reduce((s, l) => s + l.debit, 0)) },
        { t: '贷方合计', num: true, f: r => money(r.lines.reduce((s, l) => s + l.credit, 0)) },
        { t: '状态', f: r => statusTag(r.status) + (r.reversed ? '<span class="tag t-void" style="margin-left:4px">已冲销</span>' : '') },
        { t: '分录明细', f: r => `<details><summary class="muted" style="cursor:pointer">查看</summary>
            <div style="padding:8px 0;min-width:340px">${r.lines.map(l => `<div class="stat-line"><span>${esc(l.subject_name || l.subject_code)} ${esc(l.summary || '')}</span>
            <b>借 ${money(l.debit)} / 贷 ${money(l.credit)}</b></div>`).join('')}</div></details>` },
        { t: '操作', f: r => {
            const b = (a, l, cls = 'btn-g') => `<button class="btn ${cls} btn-sm" onclick="actVoucher(${r.id},'${a}')">${l}</button>`;
            if (r.status === 'draft') return b('submit', '提交') + b('post', '直接过账') + b('void', '作废', 'btn-r');
            if (r.status === 'submitted') return b('approve', '审核通过');
            if (r.status === 'approved') return b('post', '过账', 'btn-p');
            if (r.status === 'posted') return b('reverse', '红字冲销', 'btn-r') +
              `<button class="btn btn-g btn-sm" onclick="attachVoucher(${r.id})">📎 附件</button>`;
            return '<span class="muted">—</span>';
          } },
      ], '暂无凭证')}</div>`;
  },

  journal: async () => {
    const kind = S.filters.fKind || '', month = S.filters.fMonth || '', recon = S.filters.fRecon || '';
    const qs = new URLSearchParams();
    if (kind) qs.set('kind', kind); if (month) qs.set('month', month); if (recon) qs.set('recon', recon);
    const [d, o] = await Promise.all([api('/api/journal?' + qs), api('/api/reports/overview')]);
    return `<div class="page-head"><div><h2>现金 / 银行日记账</h2><div class="hint">由已过账凭证自动生成 · 逐笔结出余额 · 支持对账勾销</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'journal')}
      <button class="btn btn-g" onclick="downloadCSV()">⬇ 导出 CSV</button>
      <button class="btn btn-p" onclick="newManual()">＋ 出纳直接登记</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">现金余额</div><div class="value">¥ ${money(o.cash_balance)}</div></div>
        <div class="kpi"><div class="label">银行余额</div><div class="value">¥ ${money(o.bank_balance)}</div></div>
        <div class="kpi"><div class="label">本期收入</div><div class="value" style="color:var(--primary)">¥ ${money(o.income)}</div></div>
        <div class="kpi"><div class="label">本期支出</div><div class="value" style="color:var(--orange)">¥ ${money(o.expense)}</div></div>
      </div>
      <div class="card"><div class="toolbar">
        <div><label>账户</label><select id="fKind" onchange="render()"><option value="">全部</option>
          <option value="cash" ${kind === 'cash' ? 'selected' : ''}>库存现金</option>
          <option value="bank" ${kind === 'bank' ? 'selected' : ''}>银行存款</option></select></div>
        <div><label>月份</label><input type="month" id="fMonth" value="${month}" onchange="render()"></div>
        <div><label>对账状态</label><select id="fRecon" onchange="render()"><option value="">全部</option>
          ${['未核对', '已核对', '已调节'].map(x => `<option ${recon === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div><button class="btn btn-g" onclick="batchRecon()">✓ 当前筛选全部标记已核对</button></div>
      </div>
      ${table(d.items, [
        { t: '日期', f: r => esc(r.journal_date) },
        { t: '账户', f: r => r.account_kind === 'cash' ? '现金' : '银行' },
        { t: '凭证号', f: r => esc(r.voucher_no || '—') },
        { t: '摘要', f: r => esc(r.summary || '—') },
        { t: '对方科目', f: r => esc(r.subject_name || r.subject_code || '—') },
        { t: '项目', f: r => esc(r.project_name || '—') },
        { t: '收入', num: true, f: r => r.direction === 'in' ? `<span class="amt-in">${money(r.amount)}</span>` : '' },
        { t: '支出', num: true, f: r => r.direction === 'out' ? `<span class="amt-out">${money(r.amount)}</span>` : '' },
        { t: '结余', num: true, f: r => `<b>${money(r.balance_after)}</b>` },
        { t: '对账', f: r => `<select style="padding:3px 6px" onchange="setRecon(${r.id},this.value)">
            ${['未核对', '已核对', '已调节'].map(x => `<option ${r.recon_status === x ? 'selected' : ''}>${x}</option>`).join('')}</select>` },
      ], '暂无流水')}</div>`;
  },

  daily: async () => {
    const month = S.filters.dMonth || thisMonth();
    const d = await api('/api/daily?month=' + month);
    const block = (kind, label) => {
      const x = d[kind];
      return `<div class="card"><h3>${label} · 日清月结 <span class="muted">期初 ¥${money(x.opening)} · 期末 ¥${money(x.closing)}</span></h3>
        ${table(x.items, [
          { t: '日期', f: r => `<b>${esc(r.journal_date)}</b>` },
          { t: '本日收入', num: true, f: r => r.income ? `<span class="amt-in">${money(r.income)}</span>` : '' },
          { t: '本日支出', num: true, f: r => r.expense ? `<span class="amt-out">${money(r.expense)}</span>` : '' },
          { t: '本日结出余额', num: true, f: r => `<b>${money(r.balance)}</b>` },
          { t: '实际盘点 / 对账单', num: true, f: r => `<input type="number" step="0.01" style="width:120px;text-align:right" value="${r.counted ?? ''}" onchange="setCheck('${kind}','${r.journal_date}',this.value)">` },
          { t: '差异', num: true, f: r => r.diff === null || r.diff === undefined ? '—' : `<span style="color:${r.diff === 0 ? 'var(--green)' : 'var(--red)'}">${money(r.diff)}</span>` },
          { t: '核对', f: r => r.diff === null || r.diff === undefined ? '<span class="muted">待盘点</span>' :
              (r.diff === 0 ? '<span class="tag t-posted">✓ 账实相符</span>' : '<span class="tag t-rejected">✗ 请核查</span>') },
        ], '本月暂无发生额')}</div>`;
    };
    return `<div class="page-head"><div><h2>日结核对</h2><div class="hint">按日自动汇总收支并结出余额；盘点后填列实际数，自动判断账实相符</div></div>
      ${EXPORT_BTN('导出 Excel', 'daily')}<input type="month" id="dMonth" value="${month}" onchange="render()" style="width:170px"></div>
      ${block('cash', '库存现金')}${block('bank', '银行存款')}`;
  },

  recon: async () => {
    const [r, st, cont] = await Promise.all([api('/api/reconciliation'), api('/api/statements'), api('/api/statements/continuity')]);
    const ambiguous = st.items.filter(x => (x.match_note || '').startsWith('歧义')).length;
    return `<div class="page-head"><div><h2>银行对账</h2><div class="hint">导入银行对账单 → 自动勾对 → 生成余额调节表</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'statements')}
      <button class="btn btn-g" onclick="importStatements()">⬆ 导入对账单</button>
      <button class="btn btn-p" onclick="autoMatch()">⚡ 自动勾对</button></div></div>
      <div class="grid2">
        <div class="card"><h3>银行存款余额调节表 ${r.balanced ? '<span class="tag t-posted">✓ 调节相符</span>' : '<span class="tag t-rejected">✗ 存在差异</span>'}</h3>
          <div class="stat-line"><span>企业银行存款日记账余额</span><b>${money(r.book_balance)}</b></div>
          <div class="stat-line"><span>加：银行已收、企业未收</span><b>${money(r.bank_unrecorded_in)}</b></div>
          <div class="stat-line"><span>减：银行已付、企业未付</span><b>${money(r.bank_unrecorded_out)}</b></div>
          <div class="stat-line" style="background:var(--blue-bg)"><span><b>调节后余额（企业口径）</b></span><b>${money(r.adjusted_book)}</b></div>
          <div class="stat-line"><span>银行对账单余额</span><b>${money(r.statement_balance)}</b></div>
          <div class="stat-line"><span>加：企业已收、银行未收</span><b>${money(r.comp_unrecorded_in)}</b></div>
          <div class="stat-line"><span>减：企业已付、银行未付</span><b>${money(r.comp_unrecorded_out)}</b></div>
          <div class="stat-line" style="background:var(--blue-bg)"><span><b>调节后余额（银行口径）</b></span><b>${money(r.adjusted_bank)}</b></div>
        </div>
        <div class="card"><h3>对账概况</h3>
          <div class="stat-line"><span>对账单笔数</span><b>${r.statement_count}</b></div>
          <div class="stat-line"><span>已匹配</span><b style="color:var(--green)">${r.matched_count}</b></div>
          <div class="stat-line"><span>未匹配银行流水</span><b>${r.unmatched_statements}</b></div>
          <div class="stat-line"><span>未匹配企业日记账</span><b>${r.unmatched_journal}</b></div>
          <div class="stat-line"><span>调节差额</span><b style="color:${r.balanced ? 'var(--green)' : 'var(--red)'}">${money(r.adjusted_book - r.adjusted_bank)}</b></div>
          <div class="stat-line"><span>歧义匹配（不自动勾对）</span><b style="color:${ambiguous ? 'var(--orange)' : 'var(--green)'}">${ambiguous}</b></div>
          <div class="stat-line"><span>对账单连续性</span><b style="color:${cont.balanced ? 'var(--green)' : 'var(--red)'}">${cont.balanced ? '✓ 无缺口' : '✗ ' + cont.issues.length + ' 处提示'}</b></div>
          <p class="muted" style="margin-top:12px">自动勾对规则：方向硬过滤 + 金额精确到分 + 日期 ±3 天；唯一候选才自动匹配，多候选判为「歧义」交人工，绝不硬猜。未匹配项自动进入余额调节表。</p>
        </div>
      </div>
      <div class="card"><h3>银行对账单明细</h3>${table(st.items, [
        { t: '日期', f: x => esc(x.statement_date) },
        { t: '摘要', f: x => esc(x.description || '—') },
        { t: '收入', num: true, f: x => x.amount_in ? `<span class="amt-in">${money(x.amount_in)}</span>` : '' },
        { t: '支出', num: true, f: x => x.amount_out ? `<span class="amt-out">${money(x.amount_out)}</span>` : '' },
        { t: '匹配状态', f: x => x.matched_journal_id ? '<span class="tag t-posted">✓ 已勾对</span>' : '<span class="tag t-submitted">未匹配</span>' },
        { t: '匹配依据 / 说明', f: x => `<span class="muted">${esc(x.match_note || '—')}</span>` },
      ], '尚未导入对账单')}</div>`;
  },

  invoices: async () => {
    const d = await api('/api/invoices');
    return `<div class="page-head"><div><h2>发票管理</h2>
      <div class="hint">进项/销项台账 · 发票号查重防重复入账 · 一键生成凭证 · 核销与账龄追踪</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'invoices')}
      <button class="btn btn-p" onclick="newInvoice()">＋ 登记发票</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">发票总数</div><div class="value">${d.stats.total}</div></div>
        <div class="kpi"><div class="label">未入账发票</div><div class="value" style="color:var(--orange)">${d.stats.unposted}</div></div>
        <div class="kpi"><div class="label">待核销发票</div><div class="value">${d.stats.open}</div></div>
        <div class="kpi"><div class="label">价税合计</div><div class="value">¥ ${money(d.stats.amount)}</div></div>
      </div>
      <div class="card">${table(d.items, [
        { t: '发票号码', f: r => `<b>${esc(r.invoice_no)}</b>` },
        { t: '类型', f: r => `<span class="tag ${r.kind === '进项' ? 't-submitted' : 't-approved'}">${r.kind}</span>` },
        { t: '日期', f: r => esc(r.invoice_date) },
        { t: '往来单位', f: r => esc(r.counterparty_name || '—') },
        { t: '不含税', num: true, f: r => money(r.amount) },
        { t: '税额', num: true, f: r => money(r.tax_amount) },
        { t: '价税合计', num: true, f: r => `<b>${money(r.total_amount)}</b>` },
        { t: '科目', f: r => esc(r.subject_name || r.subject_code || '—') },
        { t: '状态', f: r => `<span class="tag ${r.status === '已核销' ? 't-posted' : (r.status === '已作废' ? 't-void' : (r.status === '已入账' ? 't-approved' : 't-submitted'))}">${r.status}</span>` },
        { t: '凭证', f: r => esc(r.voucher_no || '—') },
        { t: '操作', f: r => r.status === '未入账'
          ? `<button class="btn btn-p btn-sm" onclick="actInvoice(${r.id},'post')">生成凭证</button> <button class="btn btn-r btn-sm" onclick="actInvoice(${r.id},'void')">作废</button>`
          : (r.status === '已入账' ? `<button class="btn btn-g btn-sm" onclick="actInvoice(${r.id},'settle')">核销</button>`
            : '<span class="muted">—</span>') },
      ], '暂无发票，点击「登记发票」开始')}</div>`;
  },

  assets: async () => {
    const period = S.filters.assetPeriod || thisMonth();
    const [d, sch] = await Promise.all([api('/api/assets'), api('/api/assets/schedule?period=' + period)]);
    return `<div class="page-head"><div><h2>固定资产</h2>
      <div class="hint">资产卡片 · 直线法自动折旧 · 一键生成折旧凭证 · 净值与剩余月数</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="assetPeriod" value="${period}" onchange="render()" style="width:165px">
      ${EXPORT_BTN('导出 Excel', 'assets')}
      <button class="btn btn-g" onclick="depreciate()">⚙ 计提本月折旧</button>
      <button class="btn btn-p" onclick="newAsset()">＋ 新增资产</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">资产数量</div><div class="value">${d.summary.count}</div></div>
        <div class="kpi"><div class="label">原值合计</div><div class="value">¥ ${money(d.summary.original)}</div></div>
        <div class="kpi"><div class="label">累计折旧</div><div class="value" style="color:var(--orange)">¥ ${money(d.summary.accumulated)}</div></div>
        <div class="kpi"><div class="label">账面净值</div><div class="value" style="color:var(--primary-dark)">¥ ${money(d.summary.net)}</div></div>
        <div class="kpi"><div class="label">月折旧额</div><div class="value" style="color:var(--primary)">¥ ${money(d.summary.monthly)}</div></div>
      </div>
      <div class="card"><h3>资产台账</h3>${table(d.items, [
        { t: '编号', f: r => `<b>${esc(r.asset_no)}</b>` }, { t: '名称', f: r => esc(r.name) },
        { t: '类别', f: r => esc(r.category) }, { t: '购入日期', f: r => esc(r.purchase_date) },
        { t: '原值', num: true, f: r => money(r.original_value) },
        { t: '残值率', num: true, f: r => (r.salvage_rate * 100).toFixed(0) + '%' },
        { t: '月折旧', num: true, f: r => money(r.monthly) },
        { t: '累计折旧', num: true, f: r => money(r.accumulated) },
        { t: '净值', num: true, f: r => `<b>${money(r.net_value)}</b>` },
        { t: '剩余月', num: true, f: r => r.remaining_months },
        { t: '状态', f: r => `<span class="tag ${r.status === '在用' ? 't-posted' : 't-void'}">${r.status}</span>
            ${r.capitalized ? '<span class="tag t-approved" style="margin-left:4px">已入账</span>' : ''}` },
        { t: '操作', f: r => {
            const btns = [];
            if (!r.capitalized) btns.push(`<button class="btn btn-p btn-sm" onclick="capitalizeAsset(${r.id})">购置入账</button>`);
            if (r.status === '在用') btns.push(`<button class="btn btn-g btn-sm" onclick="actAsset(${r.id},'dispose')">清理</button>`);
            return btns.join(' ') || '—';
          } },
      ], '暂无固定资产')}</div>
      <div class="card"><h3>${esc(period)} 折旧明细 <span class="muted">合计 ${money(sch.total)}</span></h3>
        ${table(sch.items, [
          { t: '资产编号', f: r => esc(r.asset_no) }, { t: '名称', f: r => esc(r.name) },
          { t: '折旧额', num: true, f: r => money(r.amount) },
          { t: '凭证ID', f: r => esc(r.voucher_id || '—') },
        ], '本月尚未计提折旧')}</div>`;
  },

  books: async () => {
    const period = S.filters.bookPeriod || thisMonth();
    const [tb, aging, cash, bud, op, partners] = await Promise.all([
      api('/api/reports/trialbalance?period=' + period), api('/api/reports/aging'),
      api('/api/reports/cashflow'), api('/api/reports/budget?period=' + period),
      api('/api/openings?period=' + period), api('/api/reports/partner')]);
    return `<div class="page-head"><div><h2>账簿与分析</h2>
      <div class="hint">科目余额表 · 现金流量简表 · 往来账龄 · 预算执行（数据全部来自已过账凭证）</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="bookPeriod" value="${period}" onchange="render()" style="width:170px">
      ${EXPORT_BTN('导出 Excel', 'voucher_lines', 'invoices', 'budgets')}</div></div>
      <div class="card"><h3>科目余额表 <span class="muted">${esc(period)} · 借方合计 ${money(tb.debit_total)} / 贷方合计 ${money(tb.credit_total)} ${tb.balanced ? '✓ 试算平衡' : '✗ 不平衡'}</span></h3>
        ${table(tb.items, [
          { t: '编码', f: r => esc(r.subject_code) }, { t: '科目', f: r => esc(r.subject_name || '—') },
          { t: '类别', f: r => esc(r.category || '—') },
          { t: '期初', num: true, f: r => money(r.opening) },
          { t: '本期借方', num: true, f: r => money(r.debit) },
          { t: '本期贷方', num: true, f: r => money(r.credit) },
          { t: '期末余额', num: true, f: r => `<b>${money(r.closing)}</b>` },
        ], '该期间暂无发生额')}</div>
      <div class="grid2">
        <div class="card"><h3>现金流量简表（按科目归集）</h3>
          <div class="stat-line"><span><b>经营流入合计</b></span><b style="color:var(--primary)">${money(cash.in_total)}</b></div>
          ${cash.inflow.map(r => `<div class="stat-line"><span>${esc(r.subject_name || r.subject_code)}（${r.cnt} 笔）</span><b>${money(r.amount)}</b></div>`).join('')}
          <div class="stat-line" style="margin-top:8px"><span><b>经营流出合计</b></span><b style="color:var(--orange)">${money(cash.out_total)}</b></div>
          ${cash.outflow.map(r => `<div class="stat-line"><span>${esc(r.subject_name || r.subject_code)}（${r.cnt} 笔）</span><b>${money(r.amount)}</b></div>`).join('')}
          <div class="stat-line" style="background:var(--blue-bg)"><span><b>净流量</b></span><b>${money(cash.net)}</b></div></div>
        <div class="card"><h3>往来账龄分析</h3>
          ${Object.entries(aging.buckets).map(([k, v]) => `<div class="stat-line"><span>${k}</span><b>${money(v)}</b></div>`).join('')}
          ${table(aging.items.slice(0, 12), [
            { t: '方向', f: r => r.direction }, { t: '发票号', f: r => esc(r.invoice_no) },
            { t: '往来单位', f: r => esc(r.counterparty_name || '—') },
            { t: '账龄(天)', num: true, f: r => r.days },
            { t: '金额', num: true, f: r => money(r.total_amount) },
          ], '暂无未核销往来')}</div>
      </div>
      <div class="card"><h3>预算执行 <button class="btn btn-g btn-sm" onclick="newBudget()">＋ 设置预算</button></h3>
        ${table(bud.items, [
          { t: '期间', f: r => esc(r.period) }, { t: '科目', f: r => esc(r.subject_name || r.subject_code || '全部') },
          { t: '项目', f: r => esc(r.project_name || '全部') },
          { t: '预算', num: true, f: r => money(r.amount) },
          { t: '实际', num: true, f: r => money(r.actual) },
          { t: '剩余', num: true, f: r => money(r.remaining) },
          { t: '执行率', num: true, f: r => r.usage + '%' },
          { t: '状态', f: r => `<span class="tag ${r.status === '超支' ? 't-rejected' : (r.status === '接近上限' ? 't-submitted' : 't-posted')}">${r.status}</span>` },
          { t: '操作', f: r => `<button class="btn btn-r btn-sm" onclick="delBudget(${r.id})">删除</button>` },
        ], '尚未设置预算')}</div>
      <div class="grid2">
        <div class="card"><h3>期初建账 <span class="muted">${esc(op.period)} · 借方 ${money(op.debit_total)} / 贷方 ${money(op.credit_total)} ${op.balanced ? '✓ 试算平衡' : '✗ 不平衡'}</span>
          <button class="btn btn-g btn-sm" onclick="editOpenings()">录入期初余额</button></h3>
          ${table(op.items, [
            { t: '科目', f: r => `${esc(r.subject_code)} ${esc(r.subject_name || '')}` },
            { t: '借方期初', num: true, f: r => money(r.debit) },
            { t: '贷方期初', num: true, f: r => money(r.credit) },
          ], '尚未录入期初余额（新账套可跳过，或从原系统导出后录入）')}</div>
        <div class="card"><h3>往来对账单</h3>
          ${table(partners.items, [
            { t: '往来单位', f: r => esc(r.name) },
            { t: '类型', f: r => esc(r.kind) },
            { t: '未结金额', num: true, f: r => money(r.open_amount) },
            { t: '操作', f: r => `<button class="btn btn-g btn-sm" onclick="partnerStmt(${r.id},'docx')">Word</button>
              <button class="btn btn-g btn-sm" onclick="partnerStmt(${r.id},'xlsx')">Excel</button>` },
          ], '暂无往来单位')}</div>
      </div>`;
  },

  compliance: async () => {
    const c = await api('/api/compliance');
    return `<div class="page-head"><div><h2>内控合规</h2>
      <div class="hint">账本不可变 · 哈希链审计 · 职责分离 · 对账规则 · 结账检查</div></div>
      <button class="btn btn-p" onclick="verifyChain()">🔍 校验审计链</button></div>
      <div class="kpis">
        <div class="kpi"><div class="label">审计链状态</div><div class="value" style="color:${c.chain.intact ? 'var(--green)' : 'var(--red)'};font-size:18px">${c.chain.intact ? '✓ 完整未篡改' : '✗ 检测到 ' + c.chain.broken.length + ' 处异常'}</div></div>
        <div class="kpi"><div class="label">审计记录</div><div class="value">${c.chain.total}</div></div>
        <div class="kpi"><div class="label">不可变触发器</div><div class="value">${c.triggers.length}</div></div>
        <div class="kpi"><div class="label">职责分离</div><div class="value" style="font-size:18px">${c.separate_duties ? '已启用' : '已关闭'}</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>内控策略（已落实到代码与数据库）</h3>
          ${c.policies.map((p, i) => `<div class="stat-line"><span>${i + 1}. ${esc(p)}</span><b style="color:var(--green)">✓</b></div>`).join('')}
          <p class="muted" style="margin-top:10px">数据库触发器：${c.triggers.map(t => esc(t)).join('、')}</p></div>
        <div class="card"><h3>治理开关</h3>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text);margin-bottom:10px">
            <input type="checkbox" id="setDuties" style="width:auto" ${c.separate_duties ? 'checked' : ''}>
            职责分离：制单/审核/过账必须由不同操作员完成</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text);margin-bottom:12px">
            <input type="checkbox" id="setBudgetCtl" style="width:auto" ${c.budget_control ? 'checked' : ''}>
            预算控制：超预算的付款/报销单据禁止结算</label>
          <button class="btn btn-p" onclick="saveCompliance()">保存设置</button>
          <div style="margin-top:14px;padding:10px;background:var(--blue-bg);border-radius:6px;font-size:12.5px">
            提示：单人使用时可关闭「职责分离」以便一人完成制单到过账；关闭后所有操作仍完整留痕在审计链中。</div>
        </div>
      </div>`;
  },

  periods: async () => {
    const [d, ck] = await Promise.all([api('/api/periods'), api('/api/closing/checklist?period=' + thisMonth())]);
    return `<div class="page-head"><div><h2>期末结账</h2><div class="hint">结账后该期间禁止新增/修改单据与凭证；如有错账需先反结账</div></div>
      ${EXPORT_BTN('导出 Excel', 'periods')}</div>
      <div class="card"><h3>结账检查清单 · ${esc(ck.period)} ${ck.can_close ? '<span class="tag t-posted">✓ 可以结账</span>' : '<span class="tag t-rejected">✗ 存在阻断项</span>'}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px">
          ${ck.items.map(x => `<div class="stat-line"><span>${x.block ? '🚫' : '⚠'} ${esc(x.name)}</span>
            <b style="color:${x.pass ? 'var(--green)' : (x.block ? 'var(--red)' : 'var(--orange)')}">${x.count} ${x.pass ? '✓' : ''}</b></div>`).join('')}
        </div>
        <p class="muted" style="margin-top:10px">🚫 为阻断项，必须清零才能结账；⚠ 为提醒项，建议处理后结账。</p></div>
      <div class="banner">结账前置条件由系统自动校验：凭证全部过账、单据完成审批结算、借贷平衡；另会提醒未核对流水、未匹配银行流水、歧义匹配、未入账发票与预算超支。</div>
      <div class="card">${table(d.items, [
        { t: '会计期间', f: r => `<b>${esc(r.period)}</b>` },
        { t: '状态', f: r => statusTag(r.status) },
        { t: '结账时间', f: r => esc(r.closed_at || '—') },
        { t: '结账人', f: r => esc(r.closed_by || '—') },
        { t: '操作', f: r => r.status === 'open'
          ? `<button class="btn btn-g btn-sm" onclick="carryForward('${r.period}')">结转损益</button>
             <button class="btn btn-p btn-sm" onclick="periodAct('${r.period}','close')">月末结账</button>`
          : `<button class="btn btn-r btn-sm" onclick="periodAct('${r.period}','reopen')">反结账</button>` },
      ], '暂无会计期间')}</div>`;
  },

  reports: async () => {
    const [m, p, s, o] = await Promise.all([
      api('/api/reports/monthly'), api('/api/reports/projects'),
      api('/api/reports/subjects'), api('/api/reports/overview')]);
    return `<div class="page-head"><div><h2>报表中心</h2><div class="hint">数据全部来自已过账凭证，口径可追溯</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'journal', 'voucher_lines', 'subjects')}
      <button class="btn btn-g" onclick="exportOffice('docx')">⬇ Word 报告</button>
      <button class="btn btn-g" onclick="exportOffice('pptx')">⬇ PPT 汇报</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">累计收入</div><div class="value" style="color:var(--primary)">¥ ${money(m.items.reduce((a, x) => a + x.income, 0))}</div></div>
        <div class="kpi"><div class="label">累计支出</div><div class="value" style="color:var(--orange)">¥ ${money(m.items.reduce((a, x) => a + x.expense, 0))}</div></div>
        <div class="kpi"><div class="label">记账月份</div><div class="value">${m.items.length}</div></div>
        <div class="kpi"><div class="label">期末资金合计</div><div class="value">¥ ${money(o.cash_balance + o.bank_balance)}</div></div>
      </div>
      <div class="card"><h3>各月收支对比</h3><div class="chart-box"><canvas id="c1"></canvas></div></div>
      <div class="grid2">
        <div class="card"><h3>项目收支汇总</h3>${table(p.items, [
          { t: '项目', f: r => `<b>${esc(r.project)}</b>` },
          { t: '借方发生额', num: true, f: r => money(r.debit) },
          { t: '贷方发生额', num: true, f: r => money(r.credit) },
          { t: '分录数', num: true, f: r => r.cnt },
        ])}</div>
        <div class="card"><h3>科目发生额汇总</h3>${table(s.items, [
          { t: '编码', f: r => esc(r.subject_code) },
          { t: '科目', f: r => esc(r.subject_name || '—') },
          { t: '类别', f: r => esc(r.category || '—') },
          { t: '借方', num: true, f: r => money(r.debit) },
          { t: '贷方', num: true, f: r => money(r.credit) },
        ])}</div>
      </div>
      <div class="card"><h3>月度明细</h3>${table(m.items, [
        { t: '月份', f: r => `<b>${esc(r.period)}</b>` },
        { t: '收入', num: true, f: r => `<span class="amt-in">${money(r.income)}</span>` },
        { t: '支出', num: true, f: r => `<span class="amt-out">${money(r.expense)}</span>` },
        { t: '净流入', num: true, f: r => `<b style="color:${r.income - r.expense >= 0 ? 'var(--green)' : 'var(--red)'}">${money(r.income - r.expense)}</b>` },
        { t: '流水笔数', num: true, f: r => r.cnt },
      ])}</div>`;
  },

  office: async () => {
    const [docs, logs] = await Promise.all([api('/api/documents'), api('/api/import/logs')]);
    const target = S.filters.officeTarget || 'journal';
    const preview = S.officePreview;
    const tables = [['journal', '日记账'], ['docs', '业务单据'], ['vouchers', '记账凭证'],
      ['voucher_lines', '凭证明细'], ['statements', '银行对账单'], ['daily', '日结核对'],
      ['subjects', '会计科目'], ['projects', '核算项目'], ['counterparties', '往来单位'],
      ['bank_accounts', '银行账户'], ['audit', '审计日志'], ['periods', '会计期间'],
      ['invoices', '发票台账'], ['budgets', '预算'], ['attachments', '文档附件'],
      ['assets', '固定资产'], ['openings', '期初余额']];
    return `<div class="page-head"><div><h2>导入导出中心</h2>
      <div class="hint">Excel / CSV 表格双向导入导出 · Word 财务报告 · PPT 工作汇报 · Office 文档登记</div></div></div>
      <div class="grid2">
        <div class="card"><h3>⬇ 导出 Excel 工作簿（可多选工作表）</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px 12px;margin-bottom:12px">
            ${tables.map(([k, v], i) => `<label style="display:flex;align-items:center;gap:5px;font-size:13px;color:var(--text)">
              <input type="checkbox" id="ex_${k}" style="width:auto" ${k === 'journal' ? 'checked' : ''}>${v}</label>`).join('')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-p" onclick="exportSelected()">⬇ 导出选中表 (.xlsx)</button>
            <button class="btn btn-g" onclick="exportExcel(${tables.map(t => "'" + t[0] + "'").join(',')})">⬇ 导出全部表</button>
          </div>
        </div>
        <div class="card"><h3>⬇ 导出 Word / PPT / 其他格式</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <button class="btn btn-p" onclick="exportOffice('docx')">⬇ Word 财务报告 (.docx)</button>
            <button class="btn btn-p" onclick="exportOffice('pptx')">⬇ PPT 工作汇报 (.pptx)</button>
            <button class="btn btn-g" onclick="downloadCSV()">⬇ 日记账 CSV</button>
            <button class="btn btn-g" onclick="backupJSON()">⬇ 全量备份 JSON</button>
          </div>
          <p class="muted">Word 报告含：资金概况、月度收支、项目/科目发生额、余额调节表、日记账明细（真实 Word 表格）；
          PPT 含封面、资金概况、月度收支表、项目表、余额调节页（真实 PPT 表格）。</p>
        </div>
      </div>
      <div class="card"><h3>⬆ 导入 Excel / CSV 表格数据</h3>
        <div class="toolbar">
          <div><label>导入目标</label><select id="officeTarget" onchange="S.officePreview=null;render()">
            ${Object.entries({ journal: '日记账（自动生成凭证）', docs: '业务单据（草稿）',
              vouchers: '记账凭证及分录', statements: '银行对账单', subjects: '会计科目',
              projects: '核算项目', counterparties: '往来单位', bank_accounts: '银行账户',
              invoices: '发票台账', budgets: '预算' })
              .map(([k, v]) => `<option value="${k}" ${target === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div><button class="btn btn-g" onclick="template('${target}')">⬇ 下载导入模板</button></div>
          <div style="flex:1"><label>选择文件 (.xlsx / .csv / .docx / .pptx / .txt / .md)</label>
            <input type="file" id="officeFile" accept=".xlsx,.csv,.docx,.pptx,.txt,.md" onchange="onOfficeFile(this)"></div>
        </div>
        ${preview ? (preview.kind === 'table' ? `
          <div class="banner">已解析「${esc(S.officeFilename)}」工作表 ${esc(preview.sheet)}：共 ${preview.total} 行数据，下面预览前 ${Math.min(preview.rows.length, 5)} 行。
          导入目标「<b>${esc($('officeTarget')?.options[$('officeTarget').selectedIndex]?.text || target)}</b>」，导入将走与界面一致的业务校验。</div>
          ${table(preview.rows.slice(0, 5), preview.headers.map(h => ({ t: esc(h), f: r => `<span class="muted">${esc(r[h])}</span>` })))}
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-p" onclick="execImport()">✓ 确认导入 ${Math.min(preview.total, 200)} 行</button>
            <button class="btn btn-g" onclick="S.officePreview=null;render()">清除预览</button></div>`
          : `<div class="banner">检测到 <b>${esc(preview.file_type)}</b>，属于非结构化文档，将登记为附件并提取文本（共 ${preview.total} 行文本）。</div>
          <div style="max-height:180px;overflow:auto;background:var(--grey-bg);padding:10px;border-radius:6px;font-size:12.5px">
            ${preview.lines.slice(0, 20).map(l => `<div>${esc(l)}</div>`).join('')}</div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-p" onclick="registerDoc()">✓ 登记为附件</button>
            <button class="btn btn-g" onclick="S.officePreview=null;render()">清除预览</button></div>`)
        : '<div class="empty">选择文件后会自动解析并预览；建议先下载导入模板按格式填写</div>'}
      </div>
      <div class="grid2">
        <div class="card"><h3>已登记文档附件</h3>${table(docs.items, [
          { t: '文件名', f: r => esc(r.filename) }, { t: '类型', f: r => esc(r.file_type) },
          { t: '大小', num: true, f: r => (r.size / 1024).toFixed(1) + ' KB' },
          { t: '上传人', f: r => esc(r.uploaded_by) },
          { t: '摘要', f: r => `<span class="muted">${esc(r.excerpt || '')}</span>` },
          { t: '操作', f: r => `<button class="btn btn-g btn-sm" onclick="downloadDoc(${r.id})">下载</button>` },
        ], '暂无文档附件')}</div>
        <div class="card"><h3>导入日志</h3>${table(logs.items, [
          { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
          { t: '目标', f: r => esc(r.target) }, { t: '文件', f: r => esc(r.filename) },
          { t: '成功', num: true, f: r => `<span style="color:var(--green)">${r.success_count}</span>` },
          { t: '失败', num: true, f: r => `<span style="color:var(--red)">${r.error_count}</span>` },
          { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
        ], '暂无导入记录')}</div>
      </div>`;
  },

  base: async () => {
    await loadMeta();
    const subj = S.meta.subjects, proj = S.meta.projects, cp = S.meta.counterparties, bank = S.meta.bank_accounts;
    return `<div class="page-head"><div><h2>基础资料</h2><div class="hint">会计科目 / 核算项目 / 往来单位 / 银行账户</div></div>
      ${EXPORT_BTN('导出 Excel', 'subjects', 'projects', 'counterparties', 'bank_accounts')}</div>
      <div class="grid2">
        <div class="card"><h3>会计科目 <button class="btn btn-g btn-sm" onclick="newBase('subjects')">＋ 新增</button></h3>
          ${table(subj, [
            { t: '编码', f: r => esc(r.code) }, { t: '名称', f: r => esc(r.name) },
            { t: '类别', f: r => esc(r.category) }, { t: '余额方向', f: r => esc(r.direction) },
          ])}</div>
        <div class="card"><h3>核算项目 <button class="btn btn-g btn-sm" onclick="newBase('projects')">＋ 新增</button></h3>
          ${table(proj, [
            { t: 'ID', f: r => r.id }, { t: '名称', f: r => esc(r.name) },
            { t: '操作', f: r => `<button class="btn btn-r btn-sm" onclick="delBase('projects',${r.id})">停用</button>` },
          ])}</div>
        <div class="card"><h3>往来单位 <button class="btn btn-g btn-sm" onclick="newBase('counterparties')">＋ 新增</button></h3>
          ${table(cp, [
            { t: 'ID', f: r => r.id }, { t: '名称', f: r => esc(r.name) },
            { t: '类型', f: r => esc(r.kind) },
            { t: '操作', f: r => `<button class="btn btn-r btn-sm" onclick="delBase('counterparties',${r.id})">停用</button>` },
          ])}</div>
        <div class="card"><h3>银行账户 <button class="btn btn-g btn-sm" onclick="newBase('bank_accounts')">＋ 新增</button></h3>
          ${table(bank, [
            { t: '账户', f: r => esc(r.name) }, { t: '开户行', f: r => esc(r.bank_name || '—') },
            { t: '账号', f: r => esc(r.account_no || '—') },
            { t: '期初余额', num: true, f: r => money(r.opening_balance) },
          ])}</div>
      </div>`;
  },

  monitor: async () => {
    const d = await api('/api/monitor'); S._monitor = d;
    const lvBadge = { 高: 'high', 中: 'medium', 低: 'low' };
    return `<div class="bigscreen">
      <div class="bs-title"><h2>资 金 监 控 中 心</h2>
        <div><span class="live">实时监控中</span>　<span class="muted">每 ${d.refresh} 秒自动刷新 · ${esc(d.month_income !== undefined ? '' : '')}数据来自 SQLite</span></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">库存现金</div><div class="value">¥ ${money(d.cash)}</div></div>
        <div class="kpi"><div class="label">银行存款</div><div class="value">¥ ${money(d.bank)}</div></div>
        <div class="kpi"><div class="label">资金合计</div><div class="value" style="color:#7EB3FF">¥ ${money(d.total)}</div></div>
        <div class="kpi"><div class="label">今日流入 / 流出</div><div class="value" style="font-size:16px"><span style="color:#60A5FA">${money(d.today_income)}</span> / <span style="color:#F59E0B">${money(d.today_expense)}</span></div></div>
        <div class="kpi"><div class="label">本月净流入</div><div class="value" style="color:${d.month_net >= 0 ? '#34D399' : '#F87171'}">¥ ${money(d.month_net)}</div></div>
        <div class="kpi"><div class="label">现金安全月数</div><div class="value" style="color:${d.safety_months !== null && d.safety_months < 3 ? '#F87171' : '#34D399'}">${d.safety_months === null ? '—' : d.safety_months + ' 个月'}</div></div>
        <div class="kpi"><div class="label">风险预警</div><div class="value" style="font-size:17px">
          <span style="color:#F87171">高 ${d.alerts_summary.high}</span> ·
          <span style="color:#FCD34D">中 ${d.alerts_summary.medium}</span> ·
          <span style="color:#93C5FD">低 ${d.alerts_summary.low}</span></div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>近 14 天收支</h3><div class="chart-box"><canvas id="mTrend"></canvas></div></div>
        <div class="card"><h3>近 6 个月趋势</h3><div class="chart-box"><canvas id="mMonths"></canvas></div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>风险预警（当前）</h3>
          ${d.alerts_top.length ? d.alerts_top.map(x => `<div class="bs-alert"><span class="lv ${lvBadge[x.level] || 'low'}">${x.level}</span>
            <div><b>${esc(x.title)}</b><div class="d">${esc(x.detail)}</div></div></div>`).join('')
            : '<div class="empty" style="color:#34D399">✓ 当前无风险预警</div>'}
          <div class="muted" style="margin-top:6px">完整列表见「风险预警」模块</div></div>
        <div class="card"><h3>项目资金构成（借方）</h3><div class="chart-box"><canvas id="mProj"></canvas></div></div>
      </div>
      <div class="card"><h3>最新流水</h3>${table(d.recent, [
        { t: '日期', f: r => esc(r.journal_date) },
        { t: '账户', f: r => r.account_kind === 'cash' ? '现金' : '银行' },
        { t: '凭证号', f: r => esc(r.voucher_no || '—') },
        { t: '摘要', f: r => esc(r.summary || '—') },
        { t: '收入', num: true, f: r => r.direction === 'in' ? `<span class="amt-in">${money(r.amount)}</span>` : '' },
        { t: '支出', num: true, f: r => r.direction === 'out' ? `<span class="amt-out">${money(r.amount)}</span>` : '' },
        { t: '结余', num: true, f: r => `<b>${money(r.balance_after)}</b>` },
      ])}</div>
    </div>`;
  },

  risk: async () => {
    const d = await api('/api/alerts');
    const cls = { 高: 'alert-high', 中: 'alert-medium', 低: 'alert-low' };
    return `<div class="page-head"><div><h2>风险预警</h2>
      <div class="hint">按可量化规则实时扫描 · 检查时间 ${esc(d.checked_at)} · 阈值可在下方调整</div></div>
      <button class="btn btn-p" onclick="render()">⟳ 立即重新扫描</button></div>
      <div class="kpis">
        <div class="kpi"><div class="label">高风险</div><div class="value" style="color:var(--red)">${d.summary.high}</div></div>
        <div class="kpi"><div class="label">中风险</div><div class="value" style="color:var(--orange)">${d.summary.medium}</div></div>
        <div class="kpi"><div class="label">低风险</div><div class="value" style="color:var(--primary)">${d.summary.low}</div></div>
        <div class="kpi"><div class="label">整体状态</div><div class="value" style="font-size:17px;color:${d.summary.high ? 'var(--red)' : (d.summary.medium ? 'var(--orange)' : 'var(--green)')}">${d.summary.high ? '需要处理' : (d.summary.medium ? '需要关注' : '健康')}</div></div>
      </div>
      <div class="card">${d.items.length ? d.items.map(x => `<div class="bs-alert"><span class="tag ${cls[x.level]}">${x.level}</span>
        <div style="flex:1"><b>${esc(x.title)}</b>　<span class="tag t-draft">${esc(x.category)}</span>
        <div class="muted" style="margin-top:3px">${esc(x.detail)}</div></div></div>`).join('')
        : '<div class="empty" style="color:var(--green)">✓ 当前无风险预警，继续保持</div>'}</div>
      <div class="card"><h3>预警阈值设置</h3>
        <div class="frow">
          <div><label>现金安全线（元）</label><input type="number" step="0.01" id="rk_cash" value="${d.settings.risk_cash_floor}"></div>
          <div><label>银行安全线（元）</label><input type="number" step="0.01" id="rk_bank" value="${d.settings.risk_bank_floor}"></div>
          <div><label>大额收支标准（元）</label><input type="number" step="0.01" id="rk_large" value="${d.settings.risk_large_txn}"></div>
          <div><label>现金安全月数警戒</label><input type="number" step="0.1" id="rk_months" value="${d.settings.risk_safety_months}"></div>
          <div><label>流水核对天数</label><input type="number" id="rk_recon" value="${d.settings.risk_recon_days}"></div>
          <div><label>预算提醒线（%）</label><input type="number" id="rk_budget" value="${d.settings.risk_budget_warn}"></div>
          <div><label>大屏刷新（秒）</label><input type="number" id="rk_refresh" value="${d.settings.monitor_refresh}"></div>
        </div>
        <button class="btn btn-p" onclick="saveRisk()">保存阈值</button>
        <p class="muted" style="margin-top:8px">规则来自业界实践：现金安全月数 = 可用资金 ÷ 月均刚性支出（近 3 月），低于警戒线说明"还能撑多久"出了问题。</p></div>`;
  },

  audit: async () => {
    const qs = new URLSearchParams();
    const from = S.filters.aFrom || '', to = S.filters.aTo || '', act = S.filters.aActor || '', ent = S.filters.aEntity || '', q = S.filters.aQ || '';
    if (from) qs.set('from', from); if (to) qs.set('to', to); if (act) qs.set('actor', act);
    if (ent) qs.set('entity', ent); if (q) qs.set('q', q);
    const [d, st] = await Promise.all([api('/api/audit?' + qs), api('/api/audit/stats')]);
    S._auditStats = st;
    const SENSITIVE = ['删除单据', '红字冲销', '月末结账', '反结账', '恢复备份', '清空', '导入整站迁移包', '删除预算', '作废凭证', '修改预警阈值', '作废发票', '资产处理'];
    return `<div class="page-head"><div><h2>审计中心</h2>
      <div class="hint">全部操作留痕 · 哈希链防篡改 · 敏感操作单独标记 · 可导出</div></div>
      <div style="display:flex;gap:8px">${EXPORT_BTN('导出 Excel', 'audit')}
      <button class="btn btn-p" onclick="verifyChain()">🔍 校验哈希链</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="label">审计记录总数</div><div class="value">${st.total}</div></div>
        <div class="kpi"><div class="label">筛选结果</div><div class="value">${d.items.length}</div></div>
        <div class="kpi"><div class="label">敏感操作（最近）</div><div class="value" style="color:var(--orange)">${st.sensitive.length}</div></div>
        <div class="kpi"><div class="label">哈希链</div><div class="value" style="font-size:16px;color:var(--green)" id="chainBadge">待校验</div></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>近 14 天操作量</h3><div class="chart-box"><canvas id="aDay"></canvas></div></div>
        <div class="card"><h3>操作类型分布</h3><div class="chart-box"><canvas id="aAction"></canvas></div></div>
      </div>
      <div class="card"><h3>敏感操作（删除 / 冲销 / 结账 / 备份恢复 / 阈值修改）</h3>
        ${table(st.sensitive, [
          { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
          { t: '操作人', f: r => esc(r.actor || '—') },
          { t: '操作', f: r => `<span class="tag t-rejected">${esc(r.action)}</span>` },
          { t: '对象', f: r => `${esc(r.entity)}${r.entity_id ? '#' + esc(r.entity_id) : ''}` },
          { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
        ], '暂无敏感操作记录')}</div>
      <div class="card"><h3>审计日志查询</h3>
        <div class="toolbar">
          <div><label>日期从</label><input type="date" id="aFrom" value="${from}" onchange="render()"></div>
          <div><label>日期至</label><input type="date" id="aTo" value="${to}" onchange="render()"></div>
          <div><label>操作人</label><input id="aActor" value="${esc(act)}" onchange="render()" placeholder="如 出纳"></div>
          <div><label>对象类型</label><select id="aEntity" onchange="render()"><option value="">全部</option>
            ${['doc', 'voucher', 'journal', 'invoice', 'asset', 'budget', 'period', 'attachment', 'system', 'settings', 'opening', 'bank_statement', 'audit'].map(x => `<option ${ent === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
          <div style="flex:1"><label>关键词</label><input id="aQ" value="${esc(q)}" oninput="S.filters.aQ=this.value;clearTimeout(this._t);this._t=setTimeout(render,400)" placeholder="操作/说明/编号"></div>
        </div>
        ${table(d.items, [
          { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
          { t: '操作人', f: r => esc(r.actor || '—') },
          { t: '操作', f: r => (SENSITIVE.includes(r.action) ? '<span class="tag t-rejected">' + esc(r.action) + '</span>' : esc(r.action)) },
          { t: '对象', f: r => `${esc(r.entity)}${r.entity_id ? '#' + esc(r.entity_id) : ''}` },
          { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
        ], '没有符合条件的审计记录')}</div>`;
  },

  help: async () => {
    const lang = S.filters.manualLang || 'zh';
    const m = await api('/api/manual?lang=' + lang);
    return `<div class="page-head"><div><h2>帮助中心 · 用户手册 Help Center · User Manual</h2>
      <div class="hint">更新时间 ${esc(m.updated_at)} · 源文件 docs/${lang === 'en' ? 'User_Manual_EN.md' : '用户手册.md'} · 随系统离线可用</div></div>
      <select onchange="S.filters.manualLang=this.value;render()" style="width:130px">
        <option value="zh" ${lang === 'zh' ? 'selected' : ''}>中文手册</option>
        <option value="en" ${lang === 'en' ? 'selected' : ''}>English Manual</option></select></div>
      <div class="card manual">${mdToHtml(m.content)}</div>`;
  },

  partner: async () => {
    await loadMeta();
    const cp = S.filters.plCp || '';
    const cps = await api('/api/reports/partner');
    if (!cp) {
      return `<div class="page-head"><div><h2>往来账（客户 / 供应商）</h2>
        <div class="hint">按往来单位归集：销项/进项发票、收付款（含日期与凭证号）、其他往来分录，逐笔余额</div></div></div>
        <div class="card"><h3>选择往来单位查看明细账</h3>
        ${table(cps.items, [
          { t: '名称', f: r => `<b>${esc(r.name)}</b>` },
          { t: '类型', f: r => esc(r.kind) },
          { t: '未结发票金额', num: true, f: r => money(r.open_amount) },
          { t: '操作', f: r => `<button class="btn btn-p btn-sm" onclick="S.filters.plCp='${r.id}';render()">查看往来明细账 →</button>` },
        ], '暂无往来单位，请先在基础资料中添加')}</div>`;
    }
    const d = await api('/api/partner-ledger?counterparty_id=' + cp);
    const c = d.counterparty || {};
    return `<div class="page-head"><div><h2>往来明细账 · ${esc(c.name || '')}</h2>
      <div class="hint">类型：${esc(c.kind || '—')} · ${esc(d.balance_text)} · 借方合计 ¥${money(d.total_debit)} · 贷方合计 ¥${money(d.total_credit)}</div></div>
      <div style="display:flex;gap:8px">
        <select onchange="S.filters.plCp=this.value;render()" style="width:170px">
          <option value="">— 换人 —</option>
          ${cps.items.map(x => `<option value="${x.id}" ${String(x.id) === String(cp) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}
        </select>
        <button class="btn btn-g" onclick="partnerStmt(${cp},'docx')">⬇ Word 对账单</button>
        <button class="btn btn-g" onclick="partnerStmt(${cp},'xlsx')">⬇ Excel 对账单</button>
        <button class="btn btn-ghost btn-sm" onclick="S.filters.plCp='';render()">← 返回列表</button>
      </div></div>
      <div class="banner">余额为正 = 该单位欠我方（应收）；余额为负 = 我方欠该单位（应付）。发票行可直接核销；收付款行来自日记账（含凭证号与日期）。</div>
      <div class="card">${table(d.items, [
        { t: '日期', f: r => esc(r.date) },
        { t: '类型', f: r => esc(r.doc) },
        { t: '单据号', f: r => esc(r.doc_no || '—') },
        { t: '凭证号', f: r => esc(r.voucher_no || '—') },
        { t: '摘要', f: r => esc(r.summary || '—') },
        { t: '借方（对方欠↑ / 我方付↑）', num: true, f: r => r.debit ? `<span class="amt-in">${money(r.debit)}</span>` : '' },
        { t: '贷方（开票↑ / 收款↑）', num: true, f: r => r.credit ? `<span class="amt-out">${money(r.credit)}</span>` : '' },
        { t: '余额', num: true, f: r => `<b style="color:${r.balance > 0 ? 'var(--primary-dark)' : (r.balance < 0 ? 'var(--orange)' : 'var(--green)')}">${money(r.balance)}</b>` },
        { t: '发票核对', f: r => r.ref.startsWith('invoice:') ? (
            r.invoice_status === '已入账' ? `<button class="btn btn-g btn-sm" onclick="actInvoice(${r.ref.split(':')[1]},'settle')">✓ 核销</button>`
            : `<span class="muted">${esc(r.invoice_status)}</span>`) : '—' },
      ], '该往来单位暂无业务')}</div>`;
  },

  fin: async () => {
    const period = S.filters.frPeriod || thisMonth();
    const [bs, inc, art, cfYtd, cfCur] = await Promise.all([
      api('/api/reports/balance-sheet?period=' + period),
      api('/api/reports/income?period=' + period),
      api('/api/reports/articulation?period=' + period),
      api('/api/reports/cashflow?period=' + period + '&scope=ytd'),
      api('/api/reports/cashflow?period=' + period + '&scope=current')]);
    const moneyRow = r => `<td class="num"><b>${money(r.amount)}</b></td>`;
    const line = r => `<tr><td>${esc(r.item)}${r.reclass ? `<div class="muted" style="font-size:11px;line-height:1.5">↳ ${esc(r.reclass)}</div>` : ''}</td>${moneyRow(r)}</tr>`;
    const detail = arr => arr.filter(x => !x._nosum).reduce((s, x) => s + x.amount, 0);
    const assetOK = Math.abs(detail(bs.assets) - bs.total_assets) < 0.005;
    const cfMap = c => {
      const o = {};
      const put = (k, name, field, v) => { (o[k] = o[k] || { name, i: 0, o: 0 })[field] = v; };
      (c.inflow || []).forEach(r => put(r.subject_code || '未指定', r.subject_name || r.subject_code || '未指定科目', 'i', r.amount));
      (c.outflow || []).forEach(r => put(r.subject_code || '未指定', r.subject_name || r.subject_code || '未指定科目', 'o', r.amount));
      return o;
    };
    const my = cfMap(cfYtd), mc = cfMap(cfCur);
    const cfRows = Object.keys(my).sort().map(k => {
      const y = my[k], c = mc[k] || { name: y.name, i: 0, o: 0 };
      return `<tr><td>${esc(y.name)}</td><td class="num">${money(c.i)}</td><td class="num">${money(c.o)}</td>
        <td class="num">${money(y.i)}</td><td class="num">${money(y.o)}</td><td class="num"><b>${money(y.i - y.o)}</b></td></tr>`;
    }).join('');
    return `<div class="page-head"><div><h2>财务报表</h2>
      <div class="hint">资产负债表 · 利润表 · 现金流量简表 · 三大勾稽自动核对｜累计数按自然年度截断（本期 ${esc(inc.year)} 年 ${esc(inc.cum_scope)}）</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="frPeriod" value="${period}" onchange="render()" style="width:165px">
      <button class="btn btn-g" onclick="window.open('/api/export/finreports.xlsx?period=${period}')">⬇ 导出报表 Excel（含编制口径）</button></div></div>
      <div class="banner">勾稽关系：① 资产 = 负债 + 所有者权益　② 账套累计净利润（分年度汇总）= 资产负债表留存收益　③ 出纳日记账现金流量净额 = 总账货币资金变动</div>
      <div class="card"><h3>勾稽关系核对 ${art.all_pass ? '<span class="tag t-posted">✓ 三大勾稽全部相符</span>' : '<span class="tag t-rejected">✗ 存在不平项</span>'}</h3>
        ${table(art.checks, [
          { t: '勾稽关系', f: r => `<b>${esc(r.name)}</b>` },
          { t: '左边', f: r => esc(r.left) },
          { t: '右边', f: r => esc(r.right) },
          { t: '结果', f: r => r.pass ? '<span class="tag t-posted">✓ 相符</span>' : `<span class="tag t-rejected">差额 ${money(r.diff)}</span>` },
          { t: '说明', f: r => `<span class="muted">${esc(r.explain)}</span>` },
        ])}</div>
      <div class="grid2">
        <div class="card"><h3>资产负债表 <span class="muted">截至 ${esc(period)}</span>
          <span class="tag ${bs.balanced ? 't-posted' : 't-rejected'}">${bs.balanced ? '✓ 平衡' : '✗ 差额 ' + money(bs.diff)}</span>
          ${assetOK ? '<span class="tag t-posted">✓ 明细=合计</span>' : '<span class="tag t-rejected">✗ 明细与合计不符</span>'}</h3>
          <table><thead><tr><th>资产</th><th class="num">金额</th></tr></thead><tbody>
            ${bs.assets.map(line).join('')}
            <tr style="background:var(--blue-bg);font-weight:700"><td>资产合计</td><td class="num">${money(bs.total_assets)}</td></tr>
          </tbody></table>
          <table style="margin-top:12px"><thead><tr><th>负债和所有者权益</th><th class="num">金额</th></tr></thead><tbody>
            ${bs.liabilities.map(line).join('')}
            <tr><td style="color:var(--text2)">负债合计</td><td class="num">${money(bs.total_liabilities)}</td></tr>
            ${bs.equity.map(line).join('')}
            <tr><td style="color:var(--text2)">所有者权益合计</td><td class="num">${money(bs.total_equity)}</td></tr>
            <tr style="background:var(--blue-bg);font-weight:700"><td>负债和所有者权益合计</td><td class="num">${money(bs.total_liabilities + bs.total_equity)}</td></tr>
          </tbody></table>
          <p class="muted" style="margin-top:8px">固定资产原值 / 累计折旧为展示行，合计按「固定资产净值」计入；贷方余额已自动重分类${bs.reclass_count ? `（共 ${bs.reclass_count} 处）` : ''}。</p></div>
        <div class="card"><h3>利润表 <span class="muted">${esc(inc.year)} 年度</span></h3>
          <table><thead><tr><th>项目</th><th class="num">本期数<br><span class="muted" style="font-weight:400">${esc(period)}</span></th><th class="num">本年累计数<br><span class="muted" style="font-weight:400">${esc(inc.cum_scope)}</span></th></tr></thead><tbody>
            ${inc.current.map((r, i) => `<tr><td>${esc(r.item)}</td><td class="num">${money(r.amount)}</td><td class="num">${money(inc.cumulative[i].amount)}</td></tr>`).join('')}
          </tbody></table>
          <p class="muted" style="margin-top:8px">累计数只统计本年度，不并入往年利润；自动排除结转凭证。勾稽②按年度汇总后与资产负债表「留存收益合计」¥${money(bs.retained)} 核对（其中 ${esc(inc.year)} 年本年累计 ¥${money(inc.net_cum)}，账套累计另含往年利润）。</p></div>
      </div>
      <div class="card"><h3>现金流量简表 <span class="muted">按对方科目归集 · 本期 / 本年累计</span></h3>
        <table><thead><tr><th>对方科目</th><th class="num">本期流入</th><th class="num">本期流出</th><th class="num">累计流入</th><th class="num">累计流出</th><th class="num">累计净额</th></tr></thead>
          <tbody>${cfRows || '<tr><td colspan="6" class="muted">该期间暂无现金流量</td></tr>'}
            <tr style="background:var(--blue-bg);font-weight:700"><td>合计</td><td class="num">${money(cfCur.in_total)}</td><td class="num">${money(cfCur.out_total)}</td>
              <td class="num">${money(cfYtd.in_total)}</td><td class="num">${money(cfYtd.out_total)}</td><td class="num">${money(cfYtd.net)}</td></tr>
          </tbody></table>
        <p class="muted" style="margin-top:8px">上表累计数为「本年度 1 月 → ${esc(period)}」口径；勾稽③用「自建账起至 ${esc(period)}」的全量口径 ¥${money(art.cashflow_net)}（跨年账套两者不同），右侧取总账货币资金期初 ¥${money(art.cash_begin)} → 期末 ¥${money(art.cash_end)}，两侧独立口径。</p></div>`;
  },

  system: async () => {
    const [h, a, ck, pm] = await Promise.all([api('/api/health'), api('/api/audit'), api('/api/selfcheck'), api('/api/portable/manifest')]);
    await loadMeta();
    return `<div class="page-head"><div><h2>系统管理</h2><div class="hint">备份 / 迁移 / 参数设置 / 审计日志</div></div></div>
      <div class="grid2">
        <div class="card"><h3>数据与迁移</h3>
          <div class="stat-line"><span>数据库</span><b>${esc(S.meta.database)}</b></div>
          <div class="stat-line"><span>已执行迁移版本</span><b>${S.meta.migrations.map(m => m.version).join(' → ')}</b></div>
          <div class="stat-line"><span>数据库大小</span><b>${(h.db_size / 1024).toFixed(0)} KB</b></div>
          <div class="stat-line"><span>服务状态</span><b style="color:var(--green)">正常</b></div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
            <button class="btn btn-p" onclick="exportPortable()">📦 下载整站迁移包（程序+数据库）</button>
            <label class="btn btn-g" style="margin:0">📂 导入整站迁移包<input type="file" id="portableFile" accept=".zip" style="display:none" onchange="importPortable(this)"></label>
            <button class="btn btn-g" onclick="backupJSON()">⬇ 仅备份数据(JSON)</button>
            <label class="btn btn-g" style="margin:0">⬆ 恢复 / 迁移<input type="file" id="restoreFile" accept=".json" style="display:none" onchange="restoreJSON(this)"></label>
            <button class="btn btn-g" onclick="downloadCSV()">⬇ 导出日记账 CSV</button>
          </div>
          <div style="margin-top:12px;padding:10px;background:var(--blue-bg);border-radius:6px;font-size:12.5px;line-height:1.7">
            <b>换电脑怎么用：</b>点「下载整站迁移包」，得到一个 zip，里面是程序 + 数据库 + 附件 + <b>Python 运行时</b> + 启动脚本。
            <br>在新电脑解压后双击 <b>启动.bat</b>（Mac 执行 <b>启动.sh</b>），浏览器自动打开 <b>http://127.0.0.1:8765</b>，无需安装任何软件。
            <br>也可以直接复制整个程序文件夹（含 data 目录）到新电脑，效果相同。
          </div>
          <div style="margin-top:10px">
            <div class="stat-line"><span>迁移包总大小（含运行时）</span><b>${(pm.total_size/1024/1024).toFixed(1)} MB</b></div>
            <div class="stat-line"><span>内置 Python 运行时</span><b style="color:${pm.runtime_available ? 'var(--green)' : 'var(--orange)'}">${pm.runtime_available ? '✓ 已包含' : '未包含（需系统 Python）'}</b></div>
            <div class="stat-line"><span>数据库表 / 记录</span><b>${pm.database_tables} 张 / 日记账 ${pm.records.journal} 笔 · 凭证 ${pm.records.vouchers} 张 · 资产 ${pm.records.assets} 项</b></div>
            ${pm.items.map(i => `<div class="stat-line"><span>${esc(i.name)}</span><b class="muted">${(i.size/1024).toFixed(0)} KB</b></div>`).join('')}
          </div>
        </div>
        <div class="card"><h3>账套参数</h3>
          <div class="frow"><div><label>单位名称</label><input id="setCompany" value="${esc(S.meta.settings.company_name || '')}"></div>
            <div><label>出纳</label><input id="setCashier" value="${esc(S.meta.settings.cashier || '')}"></div></div>
          <div class="frow"><div><label>会计</label><input id="setAccountant" value="${esc(S.meta.settings.accountant || '')}"></div>
            <div><label>现金期初余额（元）</label><input type="number" step="0.01" id="setCash" value="${esc(S.meta.settings.cash_opening || '0')}"></div></div>
          <button class="btn btn-p" onclick="saveSettings()">保存参数</button>
          <p class="muted" style="margin-top:8px">修改现金期初后，现金日记账余额会自动重算。</p>
        </div>
      </div>
      <div class="card"><h3>数据自检 <span class="tag ${ck.ok ? 't-posted' : 't-rejected'}">${ck.ok ? '✓ 全部通过' : '✗ 发现问题'}</span>
        <button class="btn btn-g btn-sm" onclick="selfCheck()">重新自检</button></h3>
        ${ck.items.map(x => `<div class="stat-line"><span>${x.pass ? '✅' : '❌'} ${esc(x.name)}</span>
          <span class="muted">${esc(x.detail)}</span></div>`).join('')}
        <p class="muted" style="margin-top:8px">检查项：试算平衡、账证相符（凭证现金银行分录 = 日记账）、余额重算一致、审计哈希链完整、科目引用完整。</p></div>
      <div class="card"><h3>审计日志（最近 300 条）</h3>${table(a.items, [
        { t: '时间', f: r => `<span class="muted">${esc(r.at)}</span>` },
        { t: '操作人', f: r => esc(r.actor || '—') },
        { t: '操作', f: r => esc(r.action) },
        { t: '对象', f: r => esc(r.entity) },
        { t: '说明', f: r => `<span class="muted">${esc(r.detail || '')}</span>` },
      ])}</div>`;
  },
};


/*==pages_v25==*/
/* V2.5 页面：效率工具 / 经营分析 / 期末配置 */
/* ===== 页面注册表（V2.5 效率工具 / 经营分析 / 期末配置 + V2.6 分析中心） =====
 * 单一路由表：新增页面只需在此登记一项，并在 index.html 加一个 data-page 按钮。
 * 所有计算逻辑均在后端 core/，这里只负责取数与渲染。 */
Object.assign(PAGES, {
  todo: async () => {
    const d = await api('/api/todo');
    return `<div class="page-head"><div><h2>我的待办中心</h2>
      <div class="hint">8 类待办自动汇总，点「前往处理」直达对应模块 · 生成于 ${esc(d.generated_at)}</div></div>
      <button class="btn btn-g" onclick="render()">🔄 刷新</button></div>
      <div class="banner">共 <b>${d.total}</b> 项待办，其中需优先处理 <b>${d.pending}</b> 项</div>
      <div class="grid2">${d.items.map(c => `<div class="card"><h3>${esc(c.label)}
        <span class="tag ${c.count ? (c.level === 'warn' ? 't-rejected' : 't-posted') : 't-posted'}">${c.count ? c.count + ' 项' : '✓ 已清空'}</span></h3>
        ${c.items.length ? c.items.map(i => `<div class="stat-line"><span>${esc(i.title)}</span>
          <span class="muted">${esc(i.sub)}</span></div>`).join('') : '<div class="empty">暂无待办</div>'}
        <button class="btn btn-g btn-sm" style="margin-top:10px" onclick="go('${c.page}')">前往处理 →</button></div>`).join('')}</div>`;
  },

  search: async () => {
    const kw = S.filters.vQ || '';
    const d = kw ? await api('/api/search?q=' + encodeURIComponent(kw)) : { q: '', groups: [], total: 0 };
    return `<div class="page-head"><div><h2>全局搜索</h2>
      <div class="hint">一次检索单据、凭证、发票、日记账、资产、往来单位</div></div></div>
      <div class="card"><div style="display:flex;gap:8px">
        <input id="vQ" value="${esc(kw)}" placeholder="输入单据号 / 摘要 / 发票号 / 单位名称"
          oninput="S.filters.vQ=this.value" onkeydown="if(event.key==='Enter')render()" style="flex:1">
        <button class="btn btn-p" onclick="render()">🔍 搜索</button>
        ${kw ? `<button class="btn btn-g" onclick="S.filters.vQ='';render()">清空</button>` : ''}</div>
        ${kw ? `<p class="muted" style="margin-top:8px">「${esc(kw)}」共找到 <b>${d.total}</b> 条结果</p>` :
          '<p class="muted" style="margin-top:8px">试试搜索「办公」「记-」「FP」等关键词</p>'}</div>
      ${d.groups.map(g => `<div class="card"><h3>${esc(g.label)} <span class="tag t-posted">${g.count}</span></h3>
        ${table(g.items, [
          { t: '编号 / 名称', f: r => `<b>${esc(r.title)}</b>` },
          { t: '说明', f: r => esc(r.sub) },
          { t: '日期', f: r => `<span class="muted">${esc(r.date || '—')}</span>` },
          { t: '金额', num: true, f: r => r.amount != null ? money(r.amount) : '—' },
          { t: '', f: r => `<button class="btn btn-g btn-sm" onclick="go('${g.page}')">查看 →</button>` },
        ])}</div>`).join('')}`;
  },

  tpl: async () => {
    const d = await api('/api/voucher-templates');
    return `<div class="page-head"><div><h2>常用凭证模板</h2>
      <div class="hint">把每月重复做的分录存成模板，一键生成草稿凭证（生成后仍需审核过账）</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-p" onclick="newTpl()">＋ 新建模板</button>
      <button class="btn btn-g" onclick="window.open('/api/vouchers/print')">🖨 打印凭证</button></div></div>
      <div class="card"><h3>已有模板 <span class="tag t-posted">${d.items.length} 个</span></h3>
        ${table(d.items, [
          { t: '模板名称', f: r => `<b>${esc(r.name)}</b>` },
          { t: '摘要', f: r => esc(r.summary || '—') },
          { t: '分录', f: r => r.lines.map(x => `${esc(x.subject_code)} ${x.debit ? '借 ' + money(x.debit) : '贷 ' + money(x.credit)}`).join('<br>') },
          { t: '金额', num: true, f: r => money(r.debit_total) },
          { t: '使用次数', num: true, f: r => r.use_count },
          { t: '操作', f: r => `<button class="btn btn-p btn-sm" onclick="useTpl(${r.id})">套用生成凭证</button>
            <button class="btn btn-g btn-sm" onclick="delTpl(${r.id})">删除</button>` },
        ], '还没有模板，点右上角「新建模板」')}</div>
      <div class="card"><h3>使用场景</h3>
        <p class="muted">每月固定发生的业务（房租、水电、折旧、工资计提、税费缴纳）做成模板后，
        不用每次重新选科目和算借贷，减少录入差错。模板只生成<strong>草稿凭证</strong>，仍走制单→审核→过账流程。</p></div>`;
  },

  print: async () => {
    const ids = S.filters.vIds || '';
    return `<div class="page-head"><div><h2>凭证打印 / 连续套打</h2>
      <div class="hint">A4 横向，每张凭证一页，含人民币大写合计与制单/审核/记账签字栏</div></div></div>
      <div class="card"><h3>选择要打印的凭证</h3>
        <div class="frow"><div><label>凭证 ID（逗号分隔，留空 = 最近 10 张已过账凭证）</label>
          <input id="vIds" value="${esc(ids)}" oninput="S.filters.vIds=this.value" placeholder="例如 1,2,3"></div></div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-p" onclick="printVouchers()">🖨 打开打印预览</button>
          <button class="btn btn-g" onclick="go('vouchers')">去凭证管理查看 ID →</button></div>
        <p class="muted" style="margin-top:10px">打印预览在新窗口打开，点窗口里的「打印全部」即可连续打印；
        用 A5 凭证纸时在打印机设置里选择对应纸张。</p></div>`;
  },

  vcheck: async () => {
    const d = await api('/api/vouchers/sequence-check');
    const s = d.summary;
    return `<div class="page-head"><div><h2>凭证合规体检</h2>
      <div class="hint">断号 / 重号 / 日期跨期 / 借贷不平 / 未过账 / 无附件 一次查完</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-g" onclick="render()">🔄 重新体检</button>
      <button class="btn btn-g" onclick="window.open('/api/vouchers/print')">🖨 打印凭证</button></div></div>
      <div class="grid2">
        <div class="card"><h3>体检概览</h3>
          <div class="stat-line"><span>凭证总数</span><b>${s.vouchers} 张 / ${s.periods} 个期间</b></div>
          <div class="stat-line"><span>发现问题</span><b style="color:${s.issues ? 'var(--orange)' : 'var(--green)'}">${s.issues} 项（严重 ${s.serious}）</b></div>
          <div class="stat-line"><span>未过账凭证</span><b>${s.unposted} 张</b></div>
          <div class="stat-line"><span>已过账但无附件</span><b>${s.no_attachment} 张</b></div>
          <p class="muted" style="margin-top:8px">断号只检查系统标准编号「记-YYYYMM###」，自定义编号不参与判断。</p></div>
        <div class="card"><h3>问题明细 ${s.serious ? '<span class="tag t-rejected">有严重项</span>' : '<span class="tag t-posted">✓ 无严重项</span>'}</h3>
          ${table(d.issues, [
            { t: '级别', f: r => `<span class="tag ${r.level === '严重' ? 't-rejected' : 't-posted'}">${esc(r.level)}</span>` },
            { t: '类型', f: r => esc(r.type) },
            { t: '期间', f: r => esc(r.period) },
            { t: '说明', f: r => `<span class="muted">${esc(r.detail)}</span>` },
          ], '✓ 未发现问题')}</div></div>`;
  },
  cfstmt: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/cashflow-statement?period=' + p);
    // 按类别名配对累计列：开启「未分类」后两列类别数可能不同，按索引取会错位
    const cumMap = Object.fromEntries(d.cumulative.categories.map(c => [c.category, c]));
    const row = c => `<tr><td><b>${esc(c.label)}</b></td>
      <td class="num">${money(c.inflow)}</td><td class="num">${money(c.outflow)}</td>
      <td class="num"><b>${money(c.net)}</b></td>
      <td class="num">${money((cumMap[c.category] || {}).net || 0)}</td></tr>`;
    return `<div class="page-head"><div><h2>现金流量表（正表）</h2>
      <div class="hint">按对方科目自动划分经营 / 投资 / 筹资三大活动 · 本期 ${esc(p)} · 累计为自建账起全量口径</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="vPeriod" value="${p}"
        oninput="S.filters.vPeriod=this.value" onchange="render()" style="width:165px"></div></div>
      <div class="banner">勾稽：累计现金流量净额 <b>¥${money(d.cumulative.net)}</b> ↔ 货币资金变动
        <b>¥${money(d.delta)}</b>（期初 ¥${money(d.cash_begin)} → 期末 ¥${money(d.cash_end)}）
        ${d.check ? '<span class="tag t-posted">✓ 相符</span>' : '<span class="tag t-rejected">✗ 不符</span>'}</div>
      ${d.unmapped && d.unmapped.length ? `<div class="banner" style="border-left-color:var(--orange)">⚠ 有 ${d.unmapped.length} 个科目未配置现金流分类，已单列「未分类」不并入经营；请到「分析规则配置」补充科目前缀。</div>` : ''}
      <div class="card"><h3>现金流量正表</h3>
        <table><thead><tr><th>项目</th><th class="num">本期流入</th><th class="num">本期流出</th>
          <th class="num">本期净额</th><th class="num">累计净额</th></tr></thead><tbody>
          ${d.current.categories.map(row).join('')}
          <tr style="background:var(--blue-bg);font-weight:700"><td>四、现金净增加额</td>
            <td class="num">${money(d.current.in_total)}</td><td class="num">${money(d.current.out_total)}</td>
            <td class="num">${money(d.current.net)}</td><td class="num">${money(d.cumulative.net)}</td></tr>
        </tbody></table>
        <p class="muted" style="margin-top:8px">${esc(d.note)}</p></div>
      <div class="grid2">${d.current.categories.map(c => `<div class="card"><h3>${esc(c.label)}</h3>
        ${table(c.items, [
          { t: '对方科目', f: r => esc(r.subject) },
          { t: '方向', f: r => esc(r.direction) },
          { t: '笔数', num: true, f: r => r.count },
          { t: '金额', num: true, f: r => money(r.amount) },
        ], '该期间无此类现金流量')}</div>`).join('')}</div>`;
  },

  ratios: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/ratios?period=' + p);
    return `<div class="page-head"><div><h2>财务比率分析</h2>
      <div class="hint">偿债 / 盈利 / 营运三大维度 10 项指标 · 基于本期累计数与期末余额</div></div>
      <input type="month" id="vPeriod" value="${p}" oninput="S.filters.vPeriod=this.value"
        onchange="render()" style="width:165px"></div>
      <div class="banner">财务健康度 <b>${d.score} 分</b>（${d.healthy}/${d.valid} 项指标处于健康区间）·
        营业收入 ¥${money(d.basis.revenue)} · 净利润 ¥${money(d.basis.net_profit)} ·
        资产 ¥${money(d.basis.total_assets)} · 负债 ¥${money(d.basis.total_liabilities)}</div>
      <div class="card"><h3>指标明细</h3>
        ${table(d.items, [
          { t: '指标', f: r => `<b>${esc(r.name)}</b>` },
          { t: '数值', num: true, f: r => r.value == null ? '—' : `<b>${r.value}</b> ${esc(r.unit)}` },
          { t: '计算公式', f: r => `<span class="muted">${esc(r.formula)}</span>` },
          { t: '参考区间', f: r => esc(r.benchmark) },
          { t: '评价', f: r => `<span class="tag ${r.status === '健康' ? 't-posted' : (r.status === '关注' ? 't-rejected' : '')}">${esc(r.status)}</span>` },
          { t: '说明', f: r => `<span class="muted">${esc(r.explain)}</span>` },
        ])}<p class="muted" style="margin-top:8px">${esc(d.note)}</p></div>`;
  },

  compare: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/compare?period=' + p);
    const g = v => v == null ? '<span class="muted">—</span>' :
      `<b style="color:${v >= 0 ? 'var(--red)' : 'var(--green)'}">${v >= 0 ? '+' : ''}${v}%</b>`;
    const keys = ['revenue', 'expense', 'net', 'inflow', 'outflow'];
    return `<div class="page-head"><div><h2>同比 · 环比分析</h2>
      <div class="hint">本月 vs 上月 vs 去年同月，另附近 12 个月趋势</div></div>
      <input type="month" id="vPeriod" value="${p}" oninput="S.filters.vPeriod=this.value"
        onchange="render()" style="width:165px"></div>
      <div class="card"><h3>三期对比 <span class="muted">${esc(d.prev.period)} / ${esc(p)} / ${esc(d.last_year.period)}</span></h3>
        <table><thead><tr><th>指标</th><th class="num">上月</th><th class="num">本月</th>
          <th class="num">去年同月</th><th class="num">环比</th><th class="num">同比</th></tr></thead><tbody>
          ${keys.map(k => `<tr><td><b>${esc(d.labels[k])}</b></td>
            <td class="num">${money(d.prev[k])}</td><td class="num"><b>${money(d.current[k])}</b></td>
            <td class="num">${money(d.last_year[k])}</td>
            <td class="num">${g(d.mom[k])}</td><td class="num">${g(d.yoy[k])}</td></tr>`).join('')}
        </tbody></table>
        <p class="muted" style="margin-top:8px">基期为 0 时增长率显示「—」，避免除零误读。</p></div>
      <div class="card"><h3>近 12 个月趋势</h3>
        ${table(d.trend, [
          { t: '期间', f: r => `<b>${esc(r.period)}</b>` },
          { t: '营业收入', num: true, f: r => money(r.revenue) },
          { t: '成本费用', num: true, f: r => money(r.expense) },
          { t: '净利润', num: true, f: r => `<b style="color:${r.net >= 0 ? 'var(--red)' : 'var(--green)'}">${money(r.net)}</b>` },
          { t: '现金流入', num: true, f: r => money(r.inflow) },
          { t: '现金流出', num: true, f: r => money(r.outflow) },
        ])}</div>`;
  },

  baddebt: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/bad-debt/preview?period=' + p);
    return `<div class="page-head"><div><h2>坏账准备计提</h2>
      <div class="hint">按应收发票账龄分档计提，自动与 1231 科目已计提额比较，只补差额、防重复计提</div></div>
      <div style="display:flex;gap:8px"><input type="month" id="vPeriod" value="${p}"
        oninput="S.filters.vPeriod=this.value" onchange="render()" style="width:165px">
      <button class="btn btn-p" onclick="doProvision('${p}')">生成计提凭证</button></div></div>
      <div class="banner">应收发票合计 <b>¥${money(d.receivable_total)}</b> ·
        应计提 <b>¥${money(d.required)}</b> · 已计提 <b>¥${money(d.provided)}</b> ·
        本次需 ${d.adjustment >= 0 ? '补提' : '冲回'} <b>¥${money(Math.abs(d.adjustment))}</b></div>
      <div class="grid2">
        <div class="card"><h3>账龄分档与计提</h3>
          <table><thead><tr><th>账龄区间</th><th class="num">应收金额</th><th>计提比例</th>
            <th class="num">应计提</th></tr></thead><tbody>
            ${d.details.map(x => `<tr><td><b>${esc(x.bucket)}</b></td><td class="num">${money(x.amount)}</td>
              <td><input type="number" step="0.01" min="0" max="100" data-rate="${esc(x.bucket)}"
                value="${x.rate_pct}" style="width:80px"> %</td>
              <td class="num">${money(x.provision)}</td></tr>`).join('')}
          </tbody></table>
          <button class="btn btn-g btn-sm" style="margin-top:10px" onclick="saveBadDebtRates()">保存计提比例</button>
          <p class="muted" style="margin-top:8px">${esc(d.note)}</p></div>
        <div class="card"><h3>计提分录规则</h3>
          <div class="stat-line"><span>补提（差额 &gt; 0）</span><b>借 6701 资产减值损失 / 贷 1231 坏账准备</b></div>
          <div class="stat-line"><span>冲回（差额 &lt; 0）</span><b>借 1231 坏账准备 / 贷 6701 资产减值损失</b></div>
          <div class="stat-line"><span>防重复</span><b>差额为 0 时拒绝生成凭证</b></div>
          <div class="stat-line"><span>过账</span><b>自动生成并过账，不影响现金/银行日记账</b></div>
          <p class="muted" style="margin-top:10px">计提比例可在左侧调整并保存；保存后点「生成计提凭证」，
          系统会写入一张转账凭证，之后再次点击会因已足额而被拦截。</p></div></div>`;
  },

  collection: async () => {
    const days = S.filters.vDays ?? '0';
    const d = await api('/api/reports/collection?days=' + days);
    return `<div class="page-head"><div><h2>往来催收清单</h2>
      <div class="hint">按往来单位汇总逾期未收发票，标记账龄级别 · 截至 ${esc(d.as_of)}</div></div>
      <div style="display:flex;gap:8px"><select onchange="S.filters.vDays=this.value;render()" style="width:150px">
        ${[['0', '全部应收'], ['30', '超 30 天'], ['60', '超 60 天'], ['90', '超 90 天']].map(
          ([v, t]) => `<option value="${v}" ${String(days) === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select><button class="btn btn-g" onclick="window.open('/api/export/collection.xlsx?days=${days}')">⬇ 导出 Excel</button></div></div>
      <div class="banner">共 <b>${d.invoice_count}</b> 张未收发票，合计 <b>¥${money(d.total)}</b>，涉及 <b>${d.items.length}</b> 家往来单位</div>
      ${d.items.map(g => `<div class="card"><h3>${esc(g.counterparty)}
        <span class="tag ${g.level === '紧急' ? 't-rejected' : 't-posted'}">${esc(g.level)}</span>
        <span class="muted">${g.count} 笔 · ¥${money(g.amount)} · 最长 ${g.max_days} 天</span></h3>
        ${table(g.items, [
          { t: '发票号', f: r => `<b>${esc(r.invoice_no)}</b>` },
          { t: '开票日期', f: r => esc(r.invoice_date) },
          { t: '账龄(天)', num: true, f: r => r.days },
          { t: '账龄区间', f: r => esc(r.bucket) },
          { t: '未收金额', num: true, f: r => money(r.amount) },
          { t: '状态', f: r => esc(r.status) },
        ])}</div>`).join('') || '<div class="empty">该条件下没有应收发票</div>'}`;
  },
  snapshots: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/snapshots');
    return `<div class="page-head"><div><h2>报表快照归档</h2>
      <div class="hint">把某一期间的三大报表 + 勾稽结果冻结成快照，随时回看、导出，不受后续记账影响</div></div></div>
      <div class="card"><h3>新建归档</h3><div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <div><label>报表期间</label><input type="month" id="vPeriod" value="${p}"
          oninput="S.filters.vPeriod=this.value" style="width:165px"></div>
        <div><label>备注</label><input id="vNote" placeholder="如：10 月月结存档" style="width:220px"></div>
        <button class="btn btn-p" onclick="saveSnapshot()">📌 冻结当期报表</button></div></div>
      <div class="card"><h3>历史快照 <span class="tag t-posted">${d.items.length} 份</span></h3>
        ${table(d.items, [
          { t: '期间', f: r => `<b>${esc(r.period)}</b>` },
          { t: '类型', f: r => esc(r.kind) },
          { t: '备注', f: r => esc(r.note || '—') },
          { t: '归档人', f: r => esc(r.created_by || '—') },
          { t: '归档时间', f: r => `<span class="muted">${esc(r.created_at)}</span>` },
          { t: '大小', num: true, f: r => (r.size / 1024).toFixed(1) + ' KB' },
          { t: '操作', f: r => `<button class="btn btn-g btn-sm" onclick="viewSnapshot(${r.id})">查看</button>
            <button class="btn btn-g btn-sm" onclick="window.open('/api/snapshots/${r.id}/export.xlsx')">⬇ Excel</button>
            <button class="btn btn-g btn-sm" onclick="delSnapshot(${r.id})">删除</button>` },
        ], '还没有归档快照')}</div>`;
  },

  yearend: async () => {
    const y = S.filters.vYear || String(new Date().getFullYear());
    const bs = await api('/api/reports/balance-sheet?period=' + y + '-12');
    const posted = bs.equity.filter(x => x.item.includes('本年利润'))[0]?.amount || 0;
    const dist = bs.equity.filter(x => x.item === '利润分配')[0]?.amount || 0;
    return `<div class="page-head"><div><h2>年度结转（本年利润 → 利润分配）</h2>
      <div class="hint">年末把 4103 本年利润余额转入 4104 利润分配，生成并过账一张转账凭证</div></div></div>
      <div class="card"><h3>选择年度</h3><div style="display:flex;gap:8px;align-items:flex-end">
        <div><label>结转年度</label><input type="number" id="vYear" value="${esc(y)}" min="2000" max="2100"
          oninput="S.filters.vYear=this.value" style="width:140px"></div>
        <button class="btn btn-p" onclick="doYearEnd()">执行年度结转</button>
        <button class="btn btn-g" onclick="render()">刷新余额</button></div>
        <p class="muted" style="margin-top:8px">结转凭证日期固定为 <b>${esc(y)}-12-31</b>；若 12 月已结账，请先反结账。</p></div>
      <div class="grid2">
        <div class="card"><h3>${esc(y)} 年末权益概览</h3>
          <div class="stat-line"><span>本年利润（已结转 4103）</span><b>¥${money(posted)}</b></div>
          <div class="stat-line"><span>利润分配（4104）</span><b>¥${money(dist)}</b></div>
          <div class="stat-line"><span>留存收益合计</span><b>¥${money(bs.retained)}</b></div>
          <div class="stat-line"><span>资产负债表</span><b>${bs.balanced ? '✓ 平衡' : '✗ 差额 ' + money(bs.diff)}</b></div></div>
        <div class="card"><h3>为什么要做年结</h3>
          <p class="muted">会计上「本年利润」只反映当年经营成果，年度终了应全额转入「利润分配—未分配利润」，
          次年 4103 从零开始。系统支持<strong>不做年结也能出正确报表</strong>（V2.4 的勾稽已兼容两种口径），
          但做了年结，报表上「本年利润」与「利润分配」的划分更符合会计规范。</p>
          <div class="stat-line"><span>盈利结转</span><b>借 4103 / 贷 4104</b></div>
          <div class="stat-line"><span>亏损结转</span><b>借 4104 / 贷 4103</b></div>
          <div class="stat-line"><span>防重复</span><b>同一年度只允许结转一次</b></div></div></div>`;
  },

  stmtimport: async () => {
    const pv = S.stmtPreview;
    const csv = S.filters.vCsv || '';
    return `<div class="page-head"><div><h2>银行对账单批量导入</h2>
      <div class="hint">粘贴 CSV / 从 Excel 复制，自动解析、查重，确认后才写入</div></div></div>
      <div class="card"><h3>① 粘贴对账单</h3>
        <textarea id="vCsv" rows="8" style="width:100%;font-family:monospace;font-size:13px"
          oninput="S.filters.vCsv=this.value" placeholder="日期,摘要,收入,支出
2026-11-01,收到货款,25000,
2026-11-02,支付房租,,3000">${esc(csv)}</textarea>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-p" onclick="previewStmtImport()">🔍 解析预览</button>
          <button class="btn btn-g" onclick="S.stmtPreview=null;S.filters.vCsv='';render()">清空</button>
          <span class="muted" style="align-self:center">格式：每行「日期,摘要,收入,支出」，收入与支出填一列即可；表头会自动跳过</span></div></div>
      ${pv ? `<div class="card"><h3>② 预览结果
        <span class="tag t-posted">可导入 ${pv.new} 行</span>
        <span class="tag ${pv.duplicates ? 't-rejected' : 't-posted'}">重复跳过 ${pv.duplicates} 行</span></h3>
        ${table(pv.items, [
          { t: '日期', f: r => esc(r.date) },
          { t: '摘要', f: r => esc(r.description) },
          { t: '收入', num: true, f: r => money(r.in) },
          { t: '支出', num: true, f: r => money(r.out) },
          { t: '状态', f: r => r.duplicate ? '<span class="tag t-rejected">已存在，跳过</span>' : '<span class="tag t-posted">待导入</span>' },
        ])}
        <button class="btn btn-p" style="margin-top:12px" onclick="confirmStmtImport()"
          ${pv.new ? '' : 'disabled'}>✓ 确认导入 ${pv.new} 行</button>
        <p class="muted" style="margin-top:8px">导入后请到「银行对账」页点「自动匹配」生成余额调节表。</p></div>` : ''}`;
  },

  subjects: async () => {
    const d = await api('/api/subjects/templates');
    return `<div class="page-head"><div><h2>会计科目模板套用</h2>
      <div class="hint">一键补齐常用会计科目 · 只新增缺失科目，绝不覆盖已有科目及余额</div></div></div>
      <div class="banner">当前账套已有 <b>${d.existing}</b> 个科目。套用后新增科目会自动进入资产负债表 / 利润表（V2.4 起支持自动归集）。</div>
      ${d.items.map(t => `<div class="card"><h3>${esc(t.name)}
        <span class="tag t-posted">${t.total} 个科目</span>
        <span class="tag ${t.missing ? 't-rejected' : 't-posted'}">待补充 ${t.missing} 个</span></h3>
        <p class="muted">${esc(t.desc)}</p>
        <div style="display:flex;gap:8px;margin:10px 0">
          <button class="btn btn-p" onclick="applySubjects('${t.key}')" ${t.missing ? '' : 'disabled'}>
            ${t.missing ? '套用并补充 ' + t.missing + ' 个科目' : '✓ 已全部存在'}</button></div>
        ${table(t.preview, [
          { t: '编码', f: r => `<b>${esc(r.code)}</b>` },
          { t: '科目名称', f: r => esc(r.name) },
          { t: '类别', f: r => esc(r.category) },
          { t: '余额方向', f: r => esc(r.direction) },
        ])}</div>`).join('')}`;
  },
});

/*==pages_v26==*/
/* V2.6 分析中心页面（在线报告 / 规则配置 / 联动关系） */
Object.assign(PAGES, {
  /* ---- V2.6 分析中心 ---- */

  analysis: async () => {
    const p = S.filters.vPeriod || thisMonth();
    const d = await api('/api/reports/analysis?period=' + p);
    return `<div class="page-head"><div><h2>在线经营分析报告</h2>
      <div class="hint">基于账套现有数据自动生成 · 图文一体 · 纯内联 SVG，离线可用、可打印为 PDF</div></div>
      <div style="display:flex;gap:8px">
        <input type="month" id="vPeriod" value="${p}" oninput="S.filters.vPeriod=this.value" onchange="render()" style="width:165px">
        <button class="btn btn-p" onclick="window.open('/api/reports/analysis.html?period=${p}')">↗ 新窗口打开</button>
        <button class="btn btn-g" onclick="window.open('/api/reports/analysis.html?period=${p}&download=1')">⬇ 导出 HTML</button></div></div>
      <div class="banner">报告含 <b>7 张图表</b>（收入 / 净利趋势、资产负债结构、现金流、比率、账龄）、
        <b>${d.conclusions.length} 条自动结论</b>、计算规则说明书、数据血缘与功能联动图；下方为实时预览。</div>
      <div class="grid2">${d.conclusions.slice(0, 4).map(c => `<div class="card"><h3>${esc(c.title)}</h3>
        <p class="muted">${esc(c.text)}</p></div>`).join('')}</div>
      <div class="card" style="padding:0;overflow:hidden">
        <iframe src="/api/reports/analysis.html?period=${p}" style="width:100%;height:1100px;border:0" title="经营分析报告"></iframe></div>`;
  },

  rules: async () => {
    const d = await api('/api/analysis/rules');
    const r = d.rules;
    const ta = (id, arr, tip) => `<label>${tip}</label><textarea id="${id}" rows="2"
      style="width:100%;font-family:monospace;font-size:12px">${esc((arr || []).join(', '))}</textarea>`;
    return `<div class="page-head"><div><h2>分析规则配置</h2>
      <div class="hint">所有计算口径集中于此，保存后现金流量分类、比率阈值、账龄基准日与坏账比例立即全站生效</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-p" onclick="saveAnalysisRules()">保存规则</button>
      <button class="btn btn-g" onclick="resetAnalysisRules()">恢复默认</button>
      <button class="btn btn-g" onclick="go('analysis')">查看分析报告 →</button></div></div>
      <div class="banner">规则驱动：改这里 → 所有报表、比率、报告、导出同时按新口径重算，无需改代码。</div>
      <div class="grid2">
        <div class="card"><h3>① 流动性划分（科目前缀）</h3>
          ${ta('rl_nca', r.liquidity.noncurrent_asset, '非流动资产（如 15 16 17 18）')}
          ${ta('rl_cl', r.liquidity.current_liability, '流动负债（如 20 22 23）')}
          ${ta('rl_ncl', r.liquidity.noncurrent_liability, '非流动负债（如 25 27，长期借款）')}
          ${ta('rl_inv', r.liquidity.inventory, '存货（速动比率扣除，如 14）')}
          <p class="muted">审计修复：流动比率分母曾误用「总负债」，导致长期借款被算作流动负债。</p></div>
        <div class="card"><h3>② 现金流分类（科目前缀，最长匹配）</h3>
          ${ta('cf_op', r.cashflow.operating, '经营活动')}
          ${ta('cf_inv', r.cashflow.investing, '投资活动')}
          ${ta('cf_fin', r.cashflow.financing, '筹资活动')}
          <label>未命中科目的处理</label><select id="cf_un" style="width:100%">
            <option value="warn" ${r.cashflow.unclassified === 'warn' ? 'selected' : ''}>单列「未分类」并提示（推荐）</option>
            <option value="operating" ${r.cashflow.unclassified === 'operating' ? 'selected' : ''}>并入经营活动（旧行为）</option></select></div>
      </div>
      <div class="grid2">
        <div class="card"><h3>③ 账龄与坏账计提</h3>
          <label>账龄基准日</label><select id="ag_basis" style="width:100%">
            <option value="period_end" ${r.aging.basis === 'period_end' ? 'selected' : ''}>按所选期间月末（推荐，可回溯）</option>
            <option value="today" ${r.aging.basis === 'today' ? 'selected' : ''}>按系统当前日期</option></select>
          <table style="margin-top:10px"><thead><tr><th>账龄区间</th><th>计提比例 %</th></tr></thead><tbody>
          ${r.aging.buckets.map(b => `<tr><td>${esc(b)}</td><td><input type="number" step="0.01" min="0" max="100"
            data-rate="${esc(b)}" value="${(r.aging.rates[b] * 100).toFixed(2)}" style="width:110px"></td></tr>`).join('')}
          </tbody></table></div>
        <div class="card"><h3>④ 财务比率健康区间</h3>
          <table><thead><tr><th>指标</th><th>下限 ≥</th><th>上限 ≤</th></tr></thead><tbody>
          ${Object.keys(r.ratios).map(n => `<tr><td>${esc(n)}</td>
            <td><input type="number" step="0.1" data-th="${esc(n)}" data-bound="min"
              value="${r.ratios[n].min ?? ''}" style="width:90px"></td>
            <td><input type="number" step="0.1" data-th="${esc(n)}" data-bound="max"
              value="${r.ratios[n].max ?? ''}" style="width:90px"></td></tr>`).join('')}
          </tbody></table><p class="muted" style="margin-top:8px">留空表示不限；状态为「健康 / 关注」并计入健康度评分。</p></div>
      </div>
      <div class="card"><h3>规则说明</h3>${table(d.docs, [
        { t: '配置项', f: x => `<b>${esc(x.path)}</b>` },
        { t: '名称', f: x => esc(x.name) },
        { t: '说明', f: x => `<span class="muted">${esc(x.desc)}</span>` },
      ])}</div>`;
  },

  graph: async () => {
    const [g, rb] = await Promise.all([api('/api/analysis/graph'), api('/api/analysis/rulebook')]);
    const writes = g.nodes.filter(n => n.type === 'write');
    const targets = {};
    g.edges.forEach(e => (targets[e.to] = targets[e.to] || []).push(e.from));
    const ans = g.nodes.filter(n => n.type === 'analysis' && targets[n.id]).sort((a, b) => targets[b.id].length - targets[a.id].length);
    const W = 880, lx = 8, rx = 620, rowH = 22;
    const H = Math.max(writes.length, ans.length) * rowH + 28;
    const ly = {}, ry = {};
    writes.forEach((n, i) => ly[n.id] = 18 + i * rowH);
    ans.forEach((n, i) => ry[n.id] = 18 + i * rowH);
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">`;
    g.edges.forEach(e => {
      if (ly[e.from] === undefined || ry[e.to] === undefined) return;
      const mx = (lx + 160 + rx) / 2;
      svg += `<path d="M${lx+160},${ly[e.from]} C${mx},${ly[e.from]} ${mx},${ry[e.to]} ${rx},${ry[e.to]}"
        fill="none" stroke="#B9C7DE" stroke-width="1" opacity=".7"><title>${esc(e.effect)}</title></path>`;
    });
    writes.forEach(n => { svg += `<rect x="${lx}" y="${ly[n.id]-9}" width="152" height="18" rx="4" fill="#2F5597"/>
      <text x="${lx+76}" y="${ly[n.id]+4}" text-anchor="middle" fill="#fff" font-size="10">${esc(n.label)}</text>`; });
    ans.forEach(n => { const t = Math.min(1, targets[n.id].length / 5);
      svg += `<rect x="${rx}" y="${ry[n.id]-9}" width="240" height="18" rx="4"
        fill="rgb(${Math.round(68+40*t)},${Math.round(114-20*t)},${Math.round(196-40*t)})"/>
        <text x="${rx+120}" y="${ry[n.id]+4}" text-anchor="middle" fill="#fff" font-size="10">${esc(n.label)} · 被 ${targets[n.id].length} 类操作影响</text>`; });
    svg += '</svg>';
    if (writes.length) setTimeout(() => { if (S.page === 'graph') showImpactDetail(writes[0].id); }, 0);
    return `<div class="page-head"><div><h2>功能联动关系</h2>
      <div class="hint">${writes.length} 类写操作 → ${ans.length} 项分析功能，共 ${g.edges.length} 条影响链；每次写操作后系统会自动提示受影响的下游</div></div></div>
      <div class="banner">会计数据是网状结构：一张凭证过账会同时改变资产负债表、利润表、现金流、比率、同比、勾稽与待办。这里把依赖显式化，避免「改一处、错一片」。</div>
      <div class="card"><h3>依赖关系图</h3>${svg}</div>
      <div class="card"><h3>影响链明细（点选查看）</h3>
        <select onchange="showImpactDetail(this.value)" style="width:260px">
          ${g.actions.map(a => `<option value="${a.id}">${esc(a.label)}（${a.count} 条影响）</option>`).join('')}
        </select><div id="impactDetail" style="margin-top:12px"></div></div>
      <div class="card"><h3>计算规则说明书</h3>${table(rb.metrics, [
        { t: '指标', f: x => `<b>${esc(x.name)}</b>` },
        { t: '公式', f: x => esc(x.formula) },
        { t: '数据源', f: x => `<span class="muted">${esc(String(x.source))}</span>` },
        { t: '口径 / 局限', f: x => `<span class="muted">${esc(x.limitation || x.scope)}</span>` },
      ])}</div>
      <div class="card"><h3>数据血缘</h3>${table(rb.lineage, [
        { t: '指标组', f: x => `<b>${esc(x.metric)}</b>` },
        { t: '来源表', f: x => `<span class="muted">${esc(x.sources.join(' / '))}</span>` },
        { t: '计算规则', f: x => esc(x.rule) },
      ])}</div>`;
  },

});

/*==pages_v28==*/
/* V2.8 工具工作台：数据驱动的功能注册表（32 个工具 / 24+ 功能）
   新增功能只需在 V28_TOOLS 里加一项，页面、表单、请求、结果渲染自动生效。 */
const V28_TOOLS = {
  acct: [
    { id: 'dimReport', title: '按部门/项目查看收支', desc: '按部门 / 职员等维度汇总已过账分录', api: '/api/v28/dimensions/report',
      fields: [{ n: 'dim_key', l: '维度', v: '部门' }, { n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'dimSet', title: '① 设置辅助核算维度', desc: '给凭证明细行打上维度标签', api: '/api/v28/dimensions', method: 'POST',
      fields: [{ n: 'entity_type', l: '对象类型', v: 'voucher_line' }, { n: 'entity_id', l: '明细行 ID', v: '1', type: 'number' },
               { n: 'dim_key', l: '维度', v: '部门' }, { n: 'dim_value', l: '值', v: '销售部' }] },
    { id: 'batchPost', title: '② 凭证批量过账', desc: '按 ID 批量过账，自动校验职责分离并返回影响链', api: '/api/v28/vouchers/batch', method: 'POST', confirm: true,
      fields: [{ n: 'ids', l: '凭证 ID（逗号分隔）', v: '1,2' }, { n: 'action', l: '动作 approve/post', v: 'post' }, { n: 'actor', l: '操作人', v: '会计主管' }] },
    { id: 'trialCompare', title: '③ 多月份科目对比', desc: '科目各期借贷净额 + 波动超 100% 异常标记', api: '/api/v28/reports/trial-compare',
      fields: [{ n: 'periods', l: '期间（逗号分隔）', v: '2026-10,2026-11' }] },
    { id: 'accrualList', title: '④ 待摊费用台账', desc: '总额、月摊销、已摊与剩余', api: '/api/v28/accruals', fields: [] },
    { id: 'accrualAdd', title: '④ 新增待摊费用', desc: '登记后可按月一键生成摊销凭证', api: '/api/v28/accruals', method: 'POST',
      fields: [{ n: 'name', l: '名称', v: '年度软件费' }, { n: 'total_amount', l: '总额', v: '1200', type: 'number' },
               { n: 'start_period', l: '起始期间', v: thisMonth() }, { n: 'end_period', l: '结束期间', v: '2026-12' }] },
    { id: 'accrualRun', title: '④ 执行本月摊销', desc: '自动生成并过账凭证，同一期间防重复', api: '/api/v28/accruals/run', method: 'POST', confirm: true,
      fields: [{ n: 'period', l: '期间', v: thisMonth() }, { n: 'actor', l: '操作人', v: '会计主管' }] },
    { id: 'numbering', title: '⑤ 凭证编号规则 / 校验', desc: '前缀与位数可配，校验历史编号合规性', api: '/api/v28/numbering/validate', fields: [] },
    { id: 'estimate', title: '⑥ 会计估计变更留痕', desc: '折旧年限 / 坏账比例变更登记与查询', api: '/api/v28/estimate-changes', fields: [] },
    { id: 'attachments', title: '⑦ 附件缺失检查', desc: '已过账但无附件的凭证清单', api: '/api/v28/vouchers/missing-attachments', fields: [] },
    { id: 'subjectUsage', title: '⑧ 科目使用频率分析', desc: '僵尸科目与 180 天未使用科目', api: '/api/v28/subjects/usage', fields: [] },
  ],
  cashier: [
    { id: 'cashCount', title: '⑨ 现金盘点（按面额）', desc: '填入各面额张数，自动算出实盘金额与账实差额', api: '/api/v28/cash-count', method: 'POST', confirm: true,
      fields: [{ n: 'count_date', l: '盘点日期', v: today() }], denominations: [100, 50, 20, 10, 5, 1, 0.5, 0.1],
      actionLabel: '保存盘点结果' },
    { id: 'cashCountList', title: '⑨ 盘点记录', desc: '历史盘点与账实差额', api: '/api/v28/cash-count', fields: [] },
    { id: 'bills', title: '⑩ 票据台账', desc: '支票 / 汇票登记、到期与逾期预警', api: '/api/v28/bills', fields: [] },
    { id: 'billAdd', title: '⑩ 登记票据', desc: '新增支票或汇票', api: '/api/v28/bills', method: 'POST',
      fields: [{ n: 'bill_no', l: '票据号', v: 'ZP001' }, { n: 'kind', l: '类型', v: '支票' },
               { n: 'amount', l: '金额', v: '5000', type: 'number' }, { n: 'issue_date', l: '出票日', v: today() },
               { n: 'due_date', l: '到期日', v: '2026-12-01' }] },
    { id: 'bankBalances', title: '⑪ 多账户资金余额', desc: '各银行账户 + 库存现金合计', api: '/api/v28/bank-balances', fields: [] },
    { id: 'fundsDaily', title: '⑫ 资金日报', desc: '按日收付存与区间汇总', api: '/api/v28/funds/daily',
      fields: [{ n: 'from', l: '开始', v: thisMonth() + '-01' }, { n: 'to', l: '结束', v: today() }] },
    { id: 'approval', title: '⑬ 付款审批分级', desc: '按金额返回应审批人', api: '/api/v28/approval-tiers',
      fields: [{ n: 'amount', l: '金额', v: '8000' }] },
    { id: 'forecast', title: '⑭ 未来资金预测', desc: '未核销发票 + 票据到期，按日预测流入流出', api: '/api/v28/funds/forecast',
      fields: [{ n: 'days', l: '天数', v: '30', type: 'number' }] },
    { id: 'cashLimit', title: '⑮ 库存现金限额', desc: '超限预警与限额设置', api: '/api/v28/cash-limit', fields: [] },
  ],
  audit: [
    { id: 'arch', title: '⑯ 系统结构体检', desc: '文件规模 / SQL 分布 / 依赖边 / 环 / 分层违规', api: '/api/v28/audit/architecture', fields: [] },
    { id: 'score', title: '⑰ 系统健康评分', desc: '6 个维度打分与改进建议', api: '/api/v28/audit/scorecard', fields: [] },
    { id: 'smells', title: '⑱ 系统质量提示', desc: '超长函数 / 动态 SQL / 裸 except / 硬编码凭据', api: '/api/v28/audit/smells', fields: [] },
    { id: 'routes', title: '⑲ 系统功能清单', desc: '全部路由、分组统计、查表平均耗时', api: '/api/v28/audit/routes', fields: [] },
    { id: 'matrix', title: '⑳ 模块关系一览', desc: '模块 × 模块依赖、环与分层违规', api: '/api/v28/audit/dependency-matrix', fields: [] },
    { id: 'runtime', title: '㉑ 系统运行状态', desc: '数据库 / 迁移版本 / 审计链 / 路由数', api: '/api/v28/audit/runtime', fields: [] },
  ],
  security: [
    { id: 'secConfig', title: '㉒ 安全配置中心', desc: '总开关、失败锁定、限流、CSRF、脱敏字段', api: '/api/v28/security/config', fields: [] },
    { id: 'secEnable', title: '㉒ 开启 / 关闭防护', desc: '开启后中间件真正拦截高风险输入与超限请求', api: '/api/v28/security/config', method: 'POST', confirm: true,
      fields: [{ n: 'enabled', l: 'enabled（true/false）', v: 'false' }] },
    { id: 'operators', title: '㉓ 操作员管理', desc: '新增操作员并分配角色', api: '/api/v28/security/operators', method: 'POST',
      fields: [{ n: 'name', l: '账号', v: '张会计' }, { n: 'password', l: '密码', v: 'Test@123' },
               { n: 'role', l: '角色', v: 'accountant' }] },
    { id: 'roles', title: '㉔ 角色权限矩阵', desc: '内置 4 角色 + 自定义角色', api: '/api/v28/security/roles', fields: [] },
    { id: 'login', title: '㉕ 登录 / 会话', desc: '失败锁定、签发 8 小时会话', api: '/api/v28/security/login', method: 'POST',
      fields: [{ n: 'name', l: '账号', v: '张会计' }, { n: 'password', l: '密码', v: 'Test@123' }] },
    { id: 'sensitive', title: '㉖ 敏感操作审计', desc: '删除 / 冲销 / 结账 / 权限变更标记', api: '/api/v28/security/sensitive-ops', fields: [] },
    { id: 'rateLimit', title: '㉗ 限流状态', desc: '每分钟请求上限与当前客户端计数', api: '/api/v28/security/rate-limit', fields: [] },
    { id: 'scan', title: '㉘ 输入内容安全检查', desc: 'XSS / SQL 注入 / 路径穿越 / 凭据泄露特征', api: '/api/v28/security/scan', method: 'POST',
      fields: [{ n: 'text', l: '待检文本', v: "SELECT * FROM t WHERE 1=1 OR 1=1" }] },
    { id: 'masking', title: '㉙ 账号信息打码预览', desc: '账号 / 手机号 / 身份证掩码', api: '/api/v28/security/masking', method: 'POST', fields: [] },
    { id: 'csrf', title: '㉚ 安全令牌', desc: '一次性令牌，开启后校验写请求', api: '/api/v28/security/csrf', fields: [] },
    { id: 'events', title: '㉛ 安全事件日志', desc: '观测与拦截事件', api: '/api/v28/security/events', fields: [] },
  ],
  competency: [
    { id: 'cpDash', title: '★ 能力图谱总览', desc: '调研科目、知识点、完整度与分轮计划', api: '/api/v28/competency/dashboard', fields: [] },
    { id: 'cpSync', title: '同步调研表', desc: '把 11 科目 × 四流 × 知识点完整写入需求图谱', api: '/api/v28/competency/sync', method: 'POST', fields: [], actionLabel: '同步一次' },
    { id: 'cpDomains', title: '① 11 个科目与四流全文', desc: '数据流 / 价值流 / 工作流 / 执行流原文', api: '/api/v28/competency/domains', fields: [] },
    { id: 'cpCoverage', title: '② 覆盖度矩阵', desc: '按科目统计已覆盖 / 部分 / 缺失 / 不适用', api: '/api/v28/competency/coverage', fields: [] },
    { id: 'cpGaps', title: '③ 缺口清单', desc: '所有未贯通的知识点，按优先级排列', api: '/api/v28/competency/gaps', fields: [] },
    { id: 'cpTrace', title: '④ 四流追溯', desc: '检查每科四流是否齐备、哪里断流', api: '/api/v28/competency/flow-trace', fields: [] },
    { id: 'cpApp', title: '⑤ 适用性判定', desc: '哪些知识点明确裁剪及原因', api: '/api/v28/competency/applicability', fields: [] },
    { id: 'cpItems', title: '⑥ 知识点明细', desc: '按科目/状态筛选全部细化条目', api: '/api/v28/competency/items', fields: [] },
  ],
  advanced: [
    { id: 'adDash', title: '★ 高阶核算工作台', desc: '资产台账、模型测算次数与工作流', api: '/api/v28/advanced/dashboard', fields: [] },
    { id: 'adAssets', title: '① 资产台账', desc: '存货/无形/投资性房地产/长投/租赁资产', api: '/api/v28/advanced/assets', fields: [] },
    { id: 'adValuation', title: '② 存货计价', desc: '先进先出 / 移动加权平均，自动算发出成本与结存', api: '/api/v28/advanced/inventory/valuation', fields: [{ n: 'item_code', l: '存货编码', v: '', method: 'query' }, { n: 'method', l: '计价方法', v: 'FIFO', method: 'query' }] },
    { id: 'adWritedown', title: '③ 存货跌价准备', desc: '成本与可变现净值孰低', api: '/api/v28/advanced/inventory/writedown', method: 'POST', fields: [{ n: 'cost', l: '账面成本', v: '', type: 'number' }, { n: 'nrv', l: '可变现净值', v: '', type: 'number' }] },
    { id: 'adAmort', title: '④ 无形资产摊销', desc: '直线法月摊销与年摊销', api: '/api/v28/advanced/intangible/amortization', method: 'POST', fields: [{ n: 'cost', l: '原值', v: '', type: 'number' }, { n: 'life_months', l: '摊销月数', v: '60', type: 'number' }, { n: 'residual', l: '残值', v: '0', type: 'number' }] },
    { id: 'adIP', title: '⑤ 投资性房地产', desc: '成本模式折旧 / 公允模式变动', api: '/api/v28/advanced/investment-property', method: 'POST', fields: [{ n: 'cost', l: '成本', v: '', type: 'number' }, { n: 'fair_value', l: '公允价值', v: '', type: 'number' }, { n: 'method', l: '计量模式', v: '成本模式' }] },
    { id: 'adEquity', title: '⑥ 长期股权投资', desc: '成本法 / 权益法期末账面价值', api: '/api/v28/advanced/equity-method', method: 'POST', fields: [{ n: 'cost', l: '初始成本', v: '', type: 'number' }, { n: 'share', l: '持股比例', v: '0.3', type: 'number' }, { n: 'profit', l: '被投资方净利润', v: '', type: 'number' }, { n: 'dividend', l: '宣告股利', v: '0', type: 'number' }] },
    { id: 'adDeferred', title: '⑦ 递延所得税', desc: '暂时性差异 → 递延所得税资产/负债', api: '/api/v28/advanced/deferred-tax', method: 'POST', fields: [{ n: 'deductible', l: '可抵扣差异', v: '', type: 'number' }, { n: 'taxable', l: '应纳税差异', v: '', type: 'number' }, { n: 'rate', l: '税率', v: '0.25', type: 'number' }] },
    { id: 'adLease', title: '⑧ 租赁负债现值', desc: '使用权资产、租赁负债、首月折旧与利息', api: '/api/v28/advanced/lease/calc', method: 'POST', fields: [{ n: 'months', l: '租赁期(月)', v: '36', type: 'number' }, { n: 'payment', l: '每期付款', v: '', type: 'number' }, { n: 'annual_rate', l: '年折现率', v: '0.05', type: 'number' }] },
    { id: 'adRevenue', title: '⑨ 收入五步法', desc: '按时段/时点与履约进度确认收入', api: '/api/v28/advanced/revenue-five-step', method: 'POST', fields: [{ n: 'amount', l: '合同金额', v: '', type: 'number' }, { n: 'timing', l: '确认方式', v: '时点' }, { n: 'progress', l: '履约进度', v: '1', type: 'number' }] },
    { id: 'adCorrection', title: '⑩ 前期差错更正 / 日后事项', desc: '追溯重述与调整事项留痕', api: '/api/v28/advanced/correction', method: 'POST', fields: [{ n: 'kind', l: '调整类型', v: '前期差错更正' }, { n: 'amount', l: '调整金额', v: '', type: 'number' }, { n: 'summary', l: '说明', v: '' }] },
    { id: 'adAdjust', title: '⑪ 调整事项台账', desc: '全部会计调整记录', api: '/api/v28/advanced/adjustments', fields: [] },
    { id: 'adModels', title: '⑫ 模型测算历史', desc: '所有财务模型输入与结果留痕', api: '/api/v28/advanced/models', fields: [] },
    { id: 'md_tvm', title: '货币时间价值', desc: '现值 / 终值 / 年金', api: '/api/v28/advanced/model/tvm', method: 'POST', fields: [{ n: "pv", l: "现值", v: "10000", type: "number" }, { n: "rate", l: "利率", v: "0.08", type: "number" }, { n: "periods", l: "期数", v: "5", type: "number" }] },
    { id: 'md_wacc', title: '加权平均资本成本 WACC', desc: '权益/债务成本与资本结构', api: '/api/v28/advanced/model/wacc', method: 'POST', fields: [{ n: "equity", l: "权益", v: "600000", type: "number" }, { n: "debt", l: "债务", v: "400000", type: "number" }, { n: "cost_equity", l: "权益成本", v: "0.12", type: "number" }, { n: "cost_debt", l: "债务成本", v: "0.06", type: "number" }, { n: "tax_rate", l: "所得税率", v: "0.25", type: "number" }] },
    { id: 'md_leverage', title: '三大杠杆', desc: '经营 / 财务 / 总杠杆', api: '/api/v28/advanced/model/leverage', method: 'POST', fields: [{ n: "sales", l: "销售额", v: "1000000", type: "number" }, { n: "variable_cost", l: "变动成本", v: "600000", type: "number" }, { n: "fixed_cost", l: "固定成本", v: "200000", type: "number" }, { n: "interest", l: "利息", v: "50000", type: "number" }] },
    { id: 'md_npv', title: '净现值 NPV', desc: '项目投资决策', api: '/api/v28/advanced/model/npv', method: 'POST', fields: [{ n: "rate", l: "折现率", v: "0.1", type: "number" }, { n: "cashflows", l: "现金流(逗号分隔,首期为负)", v: "-10000", type: "number" }] },
    { id: 'md_irr', title: '内含报酬率 IRR', desc: '与资本成本比较', api: '/api/v28/advanced/model/irr', method: 'POST', fields: [{ n: "cashflows", l: "现金流(逗号分隔)", v: "-10000", type: "number" }] },
    { id: 'md_cvp', title: '本量利分析', desc: '盈亏临界点与安全边际', api: '/api/v28/advanced/model/cvp', method: 'POST', fields: [{ n: "price", l: "单价", v: "100", type: "number" }, { n: "unit_variable", l: "单位变动成本", v: "60", type: "number" }, { n: "fixed_cost", l: "固定成本", v: "20000", type: "number" }, { n: "sales_qty", l: "预计销量", v: "1000", type: "number" }] },
    { id: 'md_variance', title: '标准成本差异', desc: '价格差异 / 效率差异', api: '/api/v28/advanced/model/variance', method: 'POST', fields: [{ n: "actual_price", l: "实际单价", v: "11", type: "number" }, { n: "standard_price", l: "标准单价", v: "10", type: "number" }, { n: "actual_qty", l: "实际用量", v: "1050", type: "number" }, { n: "standard_qty", l: "标准用量", v: "1000", type: "number" }] },
    { id: 'md_abc', title: '作业成本法 ABC', desc: '按成本动因分摊制造费用', api: '/api/v28/advanced/model/abc', method: 'POST', fields: [{ n: "product_driver_share", l: "本产品动因占比", v: "0.3", type: "number" }] },
    { id: 'md_dupont', title: '杜邦分析', desc: 'ROE 三因素分解', api: '/api/v28/advanced/model/dupont', method: 'POST', fields: [{ n: "net_profit", l: "净利润", v: "100000", type: "number" }, { n: "revenue", l: "营业收入", v: "1000000", type: "number" }, { n: "assets", l: "总资产", v: "500000", type: "number" }, { n: "equity", l: "净资产", v: "250000", type: "number" }] },
    { id: 'md_eva', title: '经济增加值 EVA', desc: 'NOPAT − 资本 × WACC', api: '/api/v28/advanced/model/eva', method: 'POST', fields: [{ n: "nopat", l: "税后净营业利润", v: "200000", type: "number" }, { n: "capital", l: "投入资本", v: "1000000", type: "number" }, { n: "wacc", l: "资本成本率", v: "0.1", type: "number" }] },
    { id: 'md_black_scholes', title: '期权定价', desc: 'Black-Scholes 欧式期权', api: '/api/v28/advanced/model/black-scholes', method: 'POST', fields: [{ n: "spot", l: "标的现价", v: "100", type: "number" }, { n: "strike", l: "行权价", v: "100", type: "number" }, { n: "years", l: "期限(年)", v: "1", type: "number" }, { n: "risk_free", l: "无风险利率", v: "0.05", type: "number" }, { n: "volatility", l: "波动率", v: "0.2", type: "number" }] },
    { id: 'adWfTpl', title: '⑬ 工作流闭环模板', desc: '全面预算 / 投融资 / 内控风险 / 税务稽查', api: '/api/v28/advanced/workflow/templates', fields: [] },
    { id: 'adWfCreate', title: '⑭ 发起一条闭环', desc: '选择类型后自动生成全部步骤', api: '/api/v28/advanced/workflow', method: 'POST', fields: [{ n: 'kind', l: '流程类型', v: '全面预算' }, { n: 'title', l: '标题', v: '' }, { n: 'amount', l: '涉及金额', v: '', type: 'number' }] },
    { id: 'adWfList', title: '⑮ 我的流程', desc: '各实例当前步骤与进度', api: '/api/v28/advanced/workflows', fields: [] },
    { id: 'adWfStep', title: '⑯ 完成当前步骤', desc: '推进一步，自动进入下一环节直到闭环', api: '/api/v28/advanced/workflow/step', method: 'POST', fields: [{ n: 'workflow_id', l: '流程编号', v: '', type: 'number' }], actionLabel: '完成这一步' },
    { id: 'adWfOverview', title: '⑰ 闭环总览', desc: '四类流程进行中 / 已完成', api: '/api/v28/advanced/workflow/overview', fields: [] },
  ],
  legal: [
    { id: 'lgDash', title: '法务工作台', desc: '合同、付款节点、纠纷、用印与合规义务汇总', api: '/api/v28/legal/dashboard', fields: [] },
    { id: 'lgContracts', title: '① 合同台账', desc: '到期提醒、已付/未付金额', api: '/api/v28/legal/contracts', fields: [] },
    { id: 'lgContractAdd', title: '① 登记合同', desc: '编号、名称、金额、起止日、付款条件', api: '/api/v28/legal/contracts', method: 'POST',
      fields: [{ n: 'contract_no', l: '合同编号', v: '' }, { n: 'title', l: '合同名称', v: '' },
               { n: 'amount', l: '合同金额', v: '', type: 'number' }, { n: 'counterparty_id', l: '往来单位 ID', v: '', type: 'number' },
               { n: 'end_date', l: '到期日', v: '' }, { n: 'kind', l: '类型', v: '采购' }] },
    { id: 'lgMilestone', title: '② 合同付款节点', desc: '分期付款计划与逾期提醒', api: '/api/v28/legal/milestones', fields: [] },
    { id: 'lgMilestoneAdd', title: '② 登记付款节点', desc: '累计金额不得超过合同总额', api: '/api/v28/legal/milestones', method: 'POST',
      fields: [{ n: 'contract_id', l: '合同编号', v: '', type: 'number' }, { n: 'due_date', l: '应付日期', v: '' },
               { n: 'amount', l: '金额', v: '', type: 'number' }] },
    { id: 'lgReview', title: '③ 法务审查清单', desc: '六项标准审查，未全通过提示暂缓用印', api: '/api/v28/legal/reviews',
      fields: [{ n: 'contract_id', l: '合同编号', v: '', type: 'number', method: 'query' }] },
    { id: 'lgCase', title: '④ 纠纷案件与或有负债', desc: '按败诉概率计算预计负债', api: '/api/v28/legal/cases', fields: [] },
    { id: 'lgSeal', title: '⑤ 用印授权', desc: '用印申请与审批，关联法务审查结果', api: '/api/v28/legal/seals', fields: [] },
    { id: 'lgDuties', title: '⑥ 合规义务', desc: '工商年报、汇算清缴等截止日倒计时', api: '/api/v28/legal/duties', fields: [] },
  ],
  audit_domain: [
    { id: 'auDash', title: '审计工作台', desc: '计划、底稿、问题整改与函证汇总', api: '/api/v28/audit-domain/dashboard', fields: [] },
    { id: 'auPlans', title: '① 年度审计计划', desc: '按风险等级安排审计范围', api: '/api/v28/audit-domain/plans', fields: [] },
    { id: 'auWp', title: '② 工作底稿', desc: '审计程序、样本量与例外记录', api: '/api/v28/audit-domain/workpapers', fields: [] },
    { id: 'auSample', title: '③ 凭证分层抽样', desc: '大额全查 + 中额/小额分层随机抽样', api: '/api/v28/audit-domain/sampling', method: 'POST',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }, { n: 'size', l: '样本数', v: '10', type: 'number' }] },
    { id: 'auFindings', title: '④ 审计发现与整改', desc: '逾期未整改预警、金额影响', api: '/api/v28/audit-domain/findings', fields: [] },
    { id: 'auConf', title: '⑤ 往来函证', desc: '账面余额、回函金额与差异', api: '/api/v28/audit-domain/confirmations', fields: [] },
    { id: 'auAdj', title: '⑥ 审计调整分录', desc: '借贷平衡强校验的调整建议', api: '/api/v28/audit-domain/adjustments', fields: [] },
  ],
  regulation: [
    { id: 'rgDash', title: '监管工作台', desc: '报送、反洗钱、关联交易汇总', api: '/api/v28/reg/dashboard', fields: [] },
    { id: 'rgReports', title: '① 监管报送台账', desc: '报表种类、周期、截止日与逾期', api: '/api/v28/reg/reports', fields: [] },
    { id: 'rgAml', title: '② 反洗钱扫描', desc: '大额交易、整数金额、快进快出、非营业时段', api: '/api/v28/reg/aml-scan', method: 'POST',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }], actionLabel: '开始扫描' },
    { id: 'rgAmlList', title: '② 反洗钱预警清单', desc: '初筛结果，需合规人员人工复核', api: '/api/v28/reg/aml-alerts', fields: [] },
    { id: 'rgRelated', title: '③ 关联方与关联交易', desc: '关联交易金额与占比', api: '/api/v28/reg/related-parties', fields: [] },
    { id: 'rgMetrics', title: '④ 监管指标', desc: '流动性、杠杆率、集中度、拨备', api: '/api/v28/reg/metrics',
      fields: [{ n: 'period', l: '期间', v: thisMonth(), method: 'query' }] },
    { id: 'rgEcl', title: '⑤ ECL 三阶段拨备', desc: '按应收账龄映射阶段并计提', api: '/api/v28/reg/ecl',
      fields: [{ n: 'period', l: '期间', v: thisMonth(), method: 'query' }] },
    { id: 'rgExport', title: '⑥ 导出监管指标', desc: '生成可报送的 CSV 文件', api: '/api/v28/reg/export', download: true, fields: [] },
  ],
  macro: [
    { id: 'mcDash', title: '宏观联动看板', desc: '收入、净利率、情景数与弹性提示', api: '/api/v28/macro/dashboard', fields: [] },
    { id: 'mcInd', title: '① 宏观指标库', desc: 'CPI / PPI / GDP / 汇率 / 利率按期间录入', api: '/api/v28/macro/indicators', fields: [] },
    { id: 'mcIndAdd', title: '① 录入宏观指标', desc: '例如 CPI 2.1（单位 %）', api: '/api/v28/macro/indicators', method: 'POST',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }, { n: 'name', l: '指标名称', v: 'CPI' },
               { n: 'value', l: '数值', v: '', type: 'number' }, { n: 'unit', l: '单位', v: '%' }] },
    { id: 'mcInfl', title: '② 通胀调整报表', desc: '按 CPI 折算为不变价，跨年可比', api: '/api/v28/macro/inflation-adjusted',
      fields: [{ n: 'base_year', l: '基准年度', v: '2026', method: 'query' }] },
    { id: 'mcBench', title: '③ 行业对标', desc: '录入行业均值并与本公司比较', api: '/api/v28/macro/benchmarks',
      fields: [{ n: 'year', l: '年度', v: '2026', method: 'query' }] },
    { id: 'mcStress', title: '④ 宏观情景压力测试', desc: '乐观/基准/悲观下的收入、成本、利率与汇率影响', api: '/api/v28/macro/stress-test',
      fields: [{ n: 'year', l: '年度', v: '2026', method: 'query' }] },
    { id: 'mcFx', title: '⑤ 外币敞口重估', desc: '汇率变动产生汇兑损益与分录建议', api: '/api/v28/macro/fx-revaluation', method: 'POST',
      fields: [{ n: 'exposure', l: '外币敞口', v: '', type: 'number' }, { n: 'old_rate', l: '原汇率', v: '7.10', type: 'number' },
               { n: 'new_rate', l: '期末汇率', v: '7.20', type: 'number' }] },
  ],
  gateway: [
    { id: 'gwDash', title: '★ 外部协同工作台', desc: '待开票/待付款/待回传统计与合规流程', api: '/api/v28/gateway/dashboard', fields: [] },
    { id: 'gwCp', title: '① 往来单位开票/收款资料', desc: '税号、发票抬头、地址电话、开户行账号完整度', api: '/api/v28/gateway/counterparties', fields: [] },
    { id: 'gwCpSet', title: '① 维护单位资料', desc: '补齐税号与收款账号（导出前自动刷新）', api: '/api/v28/gateway/counterparties', method: 'POST',
      fields: [{ n: 'id', l: '单位 ID', v: '1', type: 'number' }, { n: 'tax_id', l: '纳税人识别号', v: '' },
               { n: 'invoice_title', l: '发票抬头', v: '' }, { n: 'bank_name', l: '开户行', v: '' }, { n: 'bank_account', l: '银行账号', v: '' }] },
    { id: 'gwInvSync', title: '② 同步开票任务', desc: '从已结算收款单/待开票记录生成任务', api: '/api/v28/gateway/invoice-tasks/sync', method: 'POST', fields: [] },
    { id: 'gwInvTasks', title: '③ 开票任务队列', desc: '待导出/已导出/已完成 + 校验结果', api: '/api/v28/gateway/invoice-tasks', fields: [] },
    { id: 'gwInvCheck', title: '④ 开票前校验', desc: '缺税号/抬头/金额/税率异常', api: '/api/v28/gateway/invoice-validate', fields: [] },
    { id: 'gwInvExp', title: '⑤ 导出数电票批量模板 CSV', desc: '生成官方批量开票格式（Excel 可直接打开）', api: '/api/v28/gateway/invoice-export', download: true, fields: [] },
    { id: 'gwInvBack', title: '⑥ 登记开票结果', desc: '把税务局开好的发票信息填进来，系统自动登记台账并查重', api: '/api/v28/gateway/invoice-import', method: 'POST',
      fields: [], rowBuilder: [
        { n: 'task_id', l: '任务编号', v: '', type: 'number' },
        { n: 'invoice_no', l: '发票号码', v: '' },
        { n: 'invoice_date', l: '开票日期', v: today() },
        { n: 'amount', l: '不含税金额', v: '', type: 'number' },
        { n: 'tax_amount', l: '税额', v: '', type: 'number' }],
      actionLabel: '登记发票' },
    { id: 'gwPortal', title: '⑦ 电子税务局入口', desc: '仅提供官方链接，不代登录', api: '/api/v28/gateway/tax-portals', fields: [] },
    { id: 'gwPaySync', title: '⑧ 同步付款任务', desc: '从已审批付款单生成任务', api: '/api/v28/gateway/payment-tasks/sync', method: 'POST', fields: [] },
    { id: 'gwPayTasks', title: '⑨ 付款任务队列', desc: '含收款账号/开户行校验', api: '/api/v28/gateway/payment-tasks', fields: [] },
    { id: 'gwPayExp', title: '⑩ 导出银行批量付款文件', desc: '按银行格式模板生成 CSV', api: '/api/v28/gateway/payment-export', download: true,
      fields: [{ n: 'template', l: '模板名', v: '通用批量付款' }] },
    { id: 'gwPayBack', title: '⑪ 登记银行付款结果', desc: '填写银行处理结果，自动更新付款任务状态', api: '/api/v28/gateway/payment-import', method: 'POST',
      fields: [], rowBuilder: [
        { n: 'task_id', l: '任务编号', v: '', type: 'number' },
        { n: 'status', l: '处理结果', v: 'success', options: [['success', '付款成功'], ['fail', '付款失败']] },
        { n: 'bank_ref', l: '银行流水号', v: '' },
        { n: 'note', l: '备注', v: '' }],
      actionLabel: '登记结果' },
    { id: 'gwStmt', title: '⑫ 导入银行对账单', desc: '选择从网银下载的 CSV/Excel 文件，系统自动识别列并查重', api: '/api/v28/gateway/statement-import', method: 'POST',
      fields: [{ n: 'template', l: '银行格式', v: '通用对账单', options: [['通用对账单', '通用格式（日期/摘要/收入/支出）'], ['工商银行对账单', '工商银行格式']] },
               { n: 'text', l: '对账单文件', v: '', type: 'file' }], actionLabel: '导入并查重' },
    { id: 'gwTpl', title: '⑬ 银行格式模板', desc: '付款/对账单列映射、编码、分隔符', api: '/api/v28/gateway/bank-templates', fields: [] },
    { id: 'gwCfg', title: '⑭ 直连配置（不含凭据）', desc: 'file 模式默认；API 模式需税局/银行资质', api: '/api/v28/gateway/config', fields: [] },
  ],
  tax: [
    { id: 'taxDash', title: '★ 税务申报工作台', desc: '本月增值税/附加/个税汇总与征期倒计时', api: '/api/v28/tax/dashboard',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'taxConfig', title: '① 税率配置中心（两位小数）', desc: '增值税率 / 附加 / 所得税 / 小微分段 / 个税表 / 税负率区间', api: '/api/v28/tax/config', fields: [] },
    { id: 'taxCalendar', title: '② 征期日历', desc: '各税种截止日（周末顺延）', api: '/api/v28/tax/calendar', fields: [] },
    { id: 'outputLedger', title: '③ 销项税额台账', desc: '按税率分组（自动推断 13%/9%/6%…）', api: '/api/v28/tax/output-ledger',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'inputLedger', title: '④ 进项税额台账', desc: '含认证状态：仅已认证可抵扣', api: '/api/v28/tax/input-ledger',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'inputCerts', title: '⑤ 进项认证', desc: '批量更新认证状态', api: '/api/v28/tax/input-certs', method: 'POST',
      fields: [{ n: 'invoice_nos', l: '发票号（逗号分隔）', v: '' }, { n: 'cert_status', l: '状态', v: '已认证' }] },
    { id: 'vatFiling', title: '⑥⑦ 增值税申报测算', desc: '销项−已认证进项+转出=应纳，附加联动', api: '/api/v28/tax/filing',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'vatSave', title: '⑦ 保存申报测算', desc: '同期间幂等更新，可记录已缴金额', api: '/api/v28/tax/filing', method: 'POST',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }, { n: 'paid', l: '已缴税额', v: '0', type: 'number' }] },
    { id: 'surtaxes', title: '⑧ 附加税费', desc: '城建 7% / 教育 3% / 地方 2%，基数=应纳增值税', api: '/api/v28/tax/surtaxes',
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'taxRatios', title: '⑨⑩ 税负率分析与两点控制', desc: '逐月增值税/所得税税负率（两位小数），超区间预警', api: '/api/v28/tax/ratios',
      fields: [{ n: 'months', l: '月数', v: '12', type: 'number' }] },
    { id: 'ratioTargets', title: '⑩ 设置税负率区间', desc: '低于下限提示少缴风险，高于上限提示多缴', api: '/api/v28/tax/ratio-targets', method: 'POST',
      fields: [{ n: 'low', l: '下限 %', v: '2.00', type: 'number' }, { n: 'high', l: '上限 %', v: '3.50', type: 'number' }] },
    { id: 'citQ', title: '⑫ 企业所得税季度预缴', desc: '利润总额×税率，小微分段自动判定', api: '/api/v28/tax/cit-quarterly', method: 'POST',
      fields: [{ n: 'period', l: '季度末月', v: thisMonth() }] },
    { id: 'ent', title: '⑪ 业务招待费限额', desc: '60% 与收入 0.5% 孰低', api: '/api/v28/tax/adjustments/entertainment', method: 'POST',
      fields: [{ n: 'year', l: '年度', v: '2026' }, { n: 'amount', l: '发生额', v: '1000', type: 'number' }] },
    { id: 'citAnnual', title: '⑭ 汇算清缴测算', desc: '利润+调整项=应纳税所得额，减已预缴', api: '/api/v28/tax/cit-annual',
      fields: [{ n: 'year', l: '年度', v: '2026' }] },
    { id: 'dividend', title: '⑮ 分红个税', desc: '股息红利 20%', api: '/api/v28/tax/dividend', method: 'POST',
      fields: [{ n: 'amount', l: '分红金额', v: '10000', type: 'number' }] },
    { id: 'payrollRun', title: '⑯⑱ 算薪（社保+个税累计预扣）', desc: '社保公积金费率可配，个税按累计预扣法', api: '/api/v28/tax/payroll/run', method: 'POST', confirm: true,
      fields: [{ n: 'period', l: '期间', v: thisMonth() }] },
    { id: 'payrollList', title: '⑯ 工资表', desc: '各月算薪明细（税前/社保/个税/实发）', api: '/api/v28/tax/payroll', fields: [] },
    { id: 'special', title: '⑰ 专项附加扣除', desc: '子女教育/赡养/房贷/租房等月度限额', api: '/api/v28/tax/special-deductions', fields: [] },
    { id: 'stamp', title: '⑲ 印花税计算器', desc: '购销合同 0.03% 等税目表', api: '/api/v28/tax/stamp', method: 'POST',
      fields: [{ n: 'name', l: '税目', v: '购销合同' }, { n: 'amount', l: '金额', v: '100000', type: 'number' }] },
  ],
};

function v28Card(t) {
  const inp = (n, label, def, type, opts) => {
    if (type === 'file') return `<div style="min-width:190px;flex:1"><label>${esc(label)}</label>
      <input type="file" id="f_${t.id}_${n}" accept=".csv,.txt,.xls,.xlsx" style="width:100%;font-size:12px"></div>`;
    if (opts) return `<div style="min-width:150px;flex:1"><label>${esc(label)}</label>
      <select id="f_${t.id}_${n}" style="width:100%">${opts.map(o =>
        `<option value="${esc(o[0])}" ${String(def) === String(o[0]) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>`;
    return `<div style="min-width:150px;flex:1"><label>${esc(label)}</label>
      <input id="f_${t.id}_${n}" value="${esc(String(def ?? ''))}" style="width:100%"
        ${type === 'number' ? 'type="number" step="0.01"' : ''}
        placeholder="${esc(String(def ?? ''))}" ></div>`;
  };
  let inputs = t.fields.map(f => inp(f.n, f.l, f.v, f.type, f.options)).join('');
  // 面额直接填张数，不出现 JSON
  if (t.denominations) {
    inputs += `<div style="width:100%;margin-top:6px"><label>各面额张数（填数字即可，留空表示没有）</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${t.denominations.map(n =>
        `<div style="width:78px"><label>${n} 元</label><input type="number" min="0" step="1" value="0"
          id="f_${t.id}_den_${n}" style="width:100%"></div>`).join('')}</div></div>`;
  }
  // 结构化回传表单
  if (t.rowBuilder) {
    inputs += `<div style="width:100%;margin-top:8px;padding:10px;background:var(--blue-bg);border-radius:6px">
      <b style="font-size:12.5px">填写回传内容</b>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${t.rowBuilder.map(f =>
        inp(f.n, f.l, f.v, f.type, f.options)).join('')}</div></div>`;
  }
  const tplBtn = t.templateDownload
    ? `<button class="btn btn-g" onclick="window.open('${t.templateDownload}')">⬇ 下载填写模板</button>` : '';
  const label = t.download ? '下载文件' : (t.actionLabel || (t.method === 'POST' ? '执行' : '查看'));
  return `<div class="card" id="tool_${t.id}"><h3>${esc(t.title)}</h3>
    <p class="muted" style="margin-bottom:10px">${esc(t.desc)}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">${inputs}
      <button class="btn ${t.method === 'POST' || t.download ? 'btn-p' : 'btn-g'}" onclick="runV28('${t.id}')">${esc(label)}</button>${tplBtn}</div>
    <div id="out_${t.id}" style="margin-top:10px"></div></div>`;
}

/* 按业务场景组织的常用操作快捷入口（面向非技术用户） */
const V28_QUICK = {
  acct: [['batchPost', '批量过账'], ['accrualRun', '摊销本月费用'], ['attachments', '查缺附件凭证'], ['subjectUsage', '查僵尸科目']],
  cashier: [['cashCount', '现金盘点'], ['fundsDaily', '看资金日报'], ['bills', '票据台账'], ['bankBalances', '各账户余额']],
  audit: [['score', '系统健康评分'], ['runtime', '系统运行状态'], ['routes', '系统功能清单'], ['smells', '系统质量提示']],
  security: [['secConfig', '安全总开关'], ['operators', '操作员与权限'], ['sensitive', '敏感操作记录'], ['events', '安全事件']],
  tax: [['taxDash', '税务申报工作台'], ['vatFiling', '增值税测算'], ['taxRatios', '税负率'], ['payrollRun', '算工资个税']],
  gateway: [['gwDash', '外部协同工作台'], ['gwInvSync', '同步待开票'], ['gwInvExp', '导出开票模板'], ['gwPayExp', '导出付款文件']],
};
/* 每个工作台按流程阶段分成三个页签，默认只显示当前页签，避免一页堆满卡片 */
const V28_TAB_NAMES = {
  acct: ['日常凭证', '期末处理', '台账与检查'],
  cashier: ['现金与盘点', '资金与预测', '票据与限额'],
  audit: ['系统体检', '结构分析', '运行监控'],
  security: ['开关与配置', '账号与权限', '审计与日志'],
  tax: ['日常申报', '税负与所得税', '工资与配置'],
  gateway: ['开票协同', '银行协同', '配置与工作台'],
  legal: ['合同与付款', '审查与纠纷', '用印与合规'],
  audit_domain: ['计划与底稿', '抽样与发现', '函证与调整'],
  regulation: ['报送与反洗钱', '关联与指标', '拨备与导出'],
  macro: ['指标与物价', '对标与情景', '汇率与看板'],
  competency: ['需求图谱', '覆盖与缺口', '追溯与裁剪'],
  advanced: ['高阶准则核算', '财务决策模型', '工作流闭环'],
};
/* 核心业务流程向导：按步骤引导，点「下一步」跳到对应卡片 */
const V28_WIZARDS = {
  gateway: { title: '批量开票四步', steps: [['同步待开票', 'gwInvSync'], ['校验资料', 'gwInvCheck'], ['导出开票模板', 'gwInvExp'], ['登记开票结果', 'gwInvBack']] },
  acct: { title: '月末处理四步', steps: [['批量过账', 'batchPost'], ['本月摊销', 'accrualRun'], ['多期对比', 'trialCompare'], ['检查缺附件', 'attachments']] },
  tax: { title: '月度税务四步', steps: [['销项台账', 'outputLedger'], ['进项认证', 'inputCerts'], ['增值税测算', 'vatFiling'], ['税负率', 'taxRatios']] },
  legal: { title: '合同管理四步', steps: [['登记合同', 'lgContractAdd'], ['付款节点', 'lgMilestoneAdd'], ['法务审查', 'lgReview'], ['用印授权', 'lgSeal']] },
};
const V28_PAGES = { acct: 'acct_tools', cashier: 'cashier_tools', audit: 'arch_audit', security: 'sec_center',
  tax: 'tax_center', gateway: 'gateway_center', legal: 'legal_center', audit_domain: 'audit_center',
  regulation: 'reg_center', macro: 'macro_center',
  competency: 'competency_center', advanced: 'advanced_center' };
function gotoTool(id) {
  const el = $('tool_' + id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.outline = '2px solid var(--primary)';
  setTimeout(() => { el.style.outline = ''; }, 2200);
}
function switchV28Tab(group, i) {
  S.filters['tab_' + group] = i;
  render();
}
function v28WizardStep(group, delta) {
  const wz = V28_WIZARDS[group];
  if (!wz) return;
  const key = 'wizard_' + group;
  let cur = parseInt(localStorage.getItem(key) || '0', 10);
  cur = Math.min(Math.max(cur + delta, 0), wz.steps.length - 1);
  localStorage.setItem(key, String(cur));
  render();
}
function v28Page(group, title, hint) {
  const tools = V28_TOOLS[group] || [];
  const tabNames = V28_TAB_NAMES[group] || ['常用', '更多'];
  const tab = Math.min(parseInt(S.filters['tab_' + group] || '0', 10), tabNames.length - 1);
  const per = Math.ceil(tools.length / tabNames.length);
  const shown = tools.slice(tab * per, (tab + 1) * per);
  const tabs = tabNames.length > 1 ? `<div class="tabs" style="margin-bottom:12px">${tabNames.map((n, i) =>
    `<button class="btn ${i === tab ? 'btn-p' : 'btn-g'} btn-sm" style="margin-right:6px" onclick="switchV28Tab('${group}',${i})">${esc(n)}（${tools.slice(i * per, (i + 1) * per).length}）</button>`).join('')}</div>` : '';
  const wz = V28_WIZARDS[group];
  let wzHtml = '';
  if (wz) {
    const cur = Math.min(parseInt(localStorage.getItem('wizard_' + group) || '0', 10), wz.steps.length - 1);
    wzHtml = `<div class="card" style="border-left:3px solid var(--primary);margin-bottom:12px">
      <h3>流程向导 · ${esc(wz.title)}</h3>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">${wz.steps.map((st, i) =>
        `<button class="btn ${i === cur ? 'btn-p' : 'btn-g'} btn-sm" onclick="localStorage.setItem('wizard_${group}','${i}');render()">${i + 1}. ${esc(st[0])}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;align-items:center"><button class="btn btn-g btn-sm" onclick="v28WizardStep('${group}',-1)">← 上一步</button>
      <span class="muted">第 ${cur + 1} / ${wz.steps.length} 步</span>
      <button class="btn btn-p btn-sm" onclick="gotoTool('${wz.steps[cur][1]}')">去完成这一步 →</button>
      <button class="btn btn-g btn-sm" onclick="v28WizardStep('${group}',1)">下一步 →</button></div></div>`;
  }
  const quick = V28_QUICK[group] || [];
  const quickHtml = quick.length ? `<div class="banner"><b>常用操作，点一下直接跳到对应卡片：</b>　${quick.map(([id, label]) =>
    `<button class="btn btn-g btn-sm" style="margin:2px" onclick="gotoTool('${id}')">${esc(label)}</button>`).join('')}</div>` : '';
  return `<div class="page-head"><div><h2>${esc(title)}</h2><div class="hint">${esc(hint)}</div></div>
    <button class="btn btn-g" onclick="render()">🔄 刷新</button></div>
    <div class="banner"><b>怎么用：</b>先选上面的<b>流程阶段</b>页签 → 在卡片里填内容 → 点蓝色按钮 → 结果以<b>中文表格</b>显示在卡片下方。</div>
    ${tabs}${wzHtml}${quickHtml}
    <div class="grid2">${shown.map(v28Card).join('')}</div>
    <p class="muted" style="margin-top:10px">本页签共 ${shown.length} 个操作（全部 ${tools.length} 个，切换页签查看其它阶段）。</p>`;
}

Object.assign(PAGES, {
  acct_tools: async () => v28Page('acct', '会计工具箱',
    '辅助核算 · 批量过账 · 多期试算 · 待摊摊销 · 编号规则 · 估计变更 · 附件 · 科目分析'),
  cashier_tools: async () => v28Page('cashier', '出纳工作台',
    '现金盘点 · 票据台账 · 多账户余额 · 资金日报 · 审批分级 · 资金预测 · 现金限额'),
  arch_audit: async () => v28Page('audit', '架构审计中心',
    'AST 静态扫描 · 代码异味 · 接口清单 · 模块关系一览 · 评分卡 · 系统运行状态'),
  sec_center: async () => v28Page('security', '安全中心',
    '默认只观测不阻断；开启后真实拦截。RBAC / 会话 / 限流 / 输入扫描 / 脱敏 / CSRF'),
  competency_center: async () => v28Page('competency', '能力图谱与需求追踪',
    '会计调研表 11 科目 × 四流（数据流 / 价值流 / 工作流 / 执行流）× 细化知识点；覆盖度、缺口与适用性'),
  advanced_center: async () => v28Page('advanced', '高阶核算与决策模型',
    '准则核算执行动作 · 财务管理量化模型 · 四条工作流闭环'),
  legal_center: async () => v28Page('legal', '法务管理',
    '合同台账与付款节点 · 法务审查 · 纠纷与或有负债 · 用印授权 · 合规义务倒计时'),
  audit_center: async () => v28Page('audit_domain', '内部审计',
    '年度审计计划 · 工作底稿 · 凭证分层抽样 · 发现整改 · 往来函证 · 调整分录'),
  reg_center: async () => v28Page('regulation', '金融监管会计',
    '监管报送 · 反洗钱初筛 · 关联交易 · 监管指标 · ECL 三阶段拨备 · 报送导出'),
  macro_center: async () => v28Page('macro', '宏观经济会计',
    '宏观指标库 · 通胀不变价调整 · 行业对标 · 情景压力测试 · 汇率重估 · 联动看板'),
  gateway_center: async () => v28Page('gateway', '外部系统协同',
    '开票与网银合规自动化：批量模板导出 / 结果回传 / 对账单导入 / 直连配置（不做模拟登录，不存凭据）'),
  tax_center: async () => v28Page('tax', '税务中心',
    '增值税台账与申报测算 · 附加税费 · 税负率两点控制 · 企业所得税预缴与汇算 · 工资社保个税累计预扣 · 印花税（税额与税负率均按两位小数计算）'),
});

/*==pages_work==*/
/* V2.15 四流工作台：按调研表 11 项「工作」组织系统。
   一行 = 一项工作；四条流是同一工作的四个视图，按步骤横向对齐。 */

/* 工作台 = 「怎么干」导向：办理进度 + 步骤清单 + 每步直达功能。
   「流」类分析（数据流 / 七流 / 知识图谱）归数据分析菜单，不在工作台内。 */
/* ---------- 办理状态与交互 ---------- */
function workRunId(no) { return parseInt(localStorage.getItem('workRun_' + no) || '0', 10); }
async function workStart(no) {
  const d = await api('/api/work/run', 'POST', { no, title: '我的办理', owner: S.actor || '' });
  localStorage.setItem('workRun_' + no, String(d.id));
  toast('✓ 已开始办理，按步骤往下走');
  render();
}
async function workNext(no) {
  const rid = workRunId(no);
  if (!rid) { toast('请先点「开始办理」', 3500); return; }
  try {
    const d = await api('/api/work/step', 'POST', { run_id: rid, owner: S.actor || '' });
    toast('✓ ' + d.完成步骤 + ' 完成' + (d.下一步 ? '，下一步：' + d.下一步 : '，全部完成'));
    render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function workReset(no) {
  localStorage.removeItem('workRun_' + no);
  toast('已重新开始');
  render();
}

/* ---------- 七流节点链视图（数据分析 · 七流分析页使用） ---------- */
function sevenFlowView(seven, name) {
  if (!seven || !seven.七流 || !seven.七流[name]) return '<div class="card"><p class="muted">七流数据尚未同步，请刷新页面</p></div>';
  const f = seven.七流[name];
  return `<div class="card"><h3>${esc(name)}（共 ${f.节点数} 个环节）</h3>
    <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:stretch;margin:12px 0">
      ${f.节点.map((n,i)=>`<div style="flex:1;min-width:150px;border:1px solid var(--border);border-radius:8px;padding:10px;background:var(--blue-bg)">
        <div class="muted" style="font-size:11px">第 ${i+1} 环 · ${esc(name)}</div>
        <b style="font-size:12.5px;line-height:1.5">${esc(n.name)}</b>
        <div class="muted" style="font-size:11px;margin-top:6px">对应：${esc(n.system_entry||'—')}</div>
        <button class="btn btn-g btn-sm" style="margin-top:8px" onclick="goPage('${esc(n.system_page||'search')}')">去系统里看 →</button>
      </div>${i<f.节点.length-1?'<div style="display:flex;align-items:center;color:var(--primary);font-size:18px">→</div>':''}`).join('')}
    </div>
    <p class="muted" style="line-height:1.9">${esc(f.原文||'')}</p></div>`;
}

/* ---------- 演示数据 ---------- */
async function demoSeed() {
  try { const d = await api('/api/work/demo/seed', 'POST', {}); toast('✓ 已载入 ' + d.载入记录 + ' 条演示数据'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
async function demoClear() {
  if (!confirm('确认清空所有演示数据？（不会删除你自己录入的数据）')) return;
  try { const d = await api('/api/work/demo/clear', 'POST', {}); toast('✓ 已清空 ' + d.删除演示记录 + ' 条'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}

async function workPage(no) {
  const d = await api('/api/work/detail?no=' + no);
  const w = d;
  try {
    const rs = (await api('/api/work/runs')).items || [];
    const run = rs.find(x => x.domain_no === no && x.status === '进行中');
    if (run) { localStorage.setItem('workRun_' + no, String(run.id)); localStorage.setItem('workStage_' + no, String(run.stage)); }
    else localStorage.removeItem('workRun_' + no);
  } catch (e) { /* 不影响页面 */ }
  const steps = w.工作流.步骤 || [];
  const rid = workRunId(no);
  const stage = parseInt(localStorage.getItem('workStage_' + no) || '0', 10);
  const cur = rid ? stage : -1;
  return `<div class="page-head"><div><h2>${esc(w.work.subject)}</h2>
    <div class="hint">${esc(w.work.exam_type)} ｜ 这项工作怎么干：按步骤办，每步直达系统功能</div></div>
    <button class="btn btn-g" onclick="goPage('dashboard')">← 我的工作</button></div>
    <div class="banner"><b>这项工作的价值：</b>${esc(w.价值流.主张)}</div>
    <div class="card"><h3>办理进度</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${rid ? `<span class="tag t-posted">正在办理（第 ${Math.min(stage + 1, steps.length)} 步 / 共 ${steps.length} 步）</span>
          <button class="btn btn-p btn-sm" onclick="workNext(${no})">✓ 完成这一步，进入下一步</button>
          <button class="btn btn-g btn-sm" onclick="workReset(${no})">重新开始</button>`
        : `<button class="btn btn-p btn-sm" onclick="workStart(${no})">开始按步骤办理</button>`}
      </div></div>
    <div class="card"><h3>流程步骤</h3>
    ${steps.map((s, i) => `<div style="border-left:3px solid ${i === cur ? 'var(--primary)' : 'var(--border)'};
        padding:10px 12px;margin-bottom:8px;background:${i === cur ? 'var(--blue-bg)' : 'transparent'};border-radius:0 6px 6px 0">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
        <b>第 ${i + 1} 步 · ${esc(s.name)}</b>
        <span class="tag ${s.关联覆盖 === '已支撑' ? 't-posted' : s.关联覆盖 === '部分支撑' ? '' : 't-rejected'}">${esc(s.关联覆盖)}</span>
      </div>
      <div class="muted" style="margin-top:6px;line-height:1.8">
        要做动作：${esc(s.执行动作)}<br>
        产生数据：${esc(s.数据流产物)}（${esc(s.数据对象)}）
      </div>
      <button class="btn btn-g btn-sm" style="margin-top:8px" onclick="goPage('${esc(s.system_page || 'search')}')">去办理 →</button>
    </div>`).join('')}
    <p class="muted">${esc(w.工作流.说明 || '')}</p></div>
    <div class="card"><h3>与这项工作联动的数据分析</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-g btn-sm" onclick="goPage('graph_map')">🕸 知识图谱（节点关系）</button>
        <button class="btn btn-g btn-sm" onclick="goPage('seven_center')">🌊 七流分析</button>
        <button class="btn btn-g btn-sm" onclick="goPage('competency_center')">🧭 能力图谱与缺口</button>
        <button class="btn btn-g btn-sm" onclick="goPage('analysis')">📈 经营分析报告</button>
      </div>
      <p class="muted" style="margin-top:8px">这项工作背后的数据关系已录入知识图谱：节点挨着节点，可逐个点开看相邻关系。</p></div>
    <div class="card" style="margin-top:12px"><h3>这项工作的知识范围（调研表子科目）</h3>
      <div class="muted" style="white-space:pre-wrap;line-height:1.9">${esc(w.子科目)}</div></div>`;
}

/* 数据分析 · 知识图谱（图数据库式节点图，节点挨着节点，可逐点探索） */
async function graphMapPage() {
  const no = parseInt(S.filters.graphNo || '1', 10);
  const d = await api('/api/work/graph?no=' + no);
  const works = (await api('/api/work/works')).items;
  return graphMapHtml(d, works, no, S.filters.graphSel || '');
}

function graphNodeDetail(d, nodeId) {
  const n = (d.nodes || []).find(x => x.id === nodeId);
  if (!n) return '<div class="empty">点左侧任一节点查看详情</div>';
  const near = (d.edges || []).filter(e => e.from === nodeId || e.to === nodeId)
    .map(e => {
      const other = e.from === nodeId ? e.to : e.from;
      const on = (d.nodes || []).find(x => x.id === other);
      return `<div class="muted">↔ ${esc(on ? on.label : other)}（${esc(e.label)}）</div>`;
    }).join('');
  return `<h3 style="margin-top:0">${esc(n.label)}</h3>
    <div class="muted" style="margin-bottom:8px">类型：${esc(n.type)}${n.page ? ' ｜ 页面：' + esc(n.page) : ''}</div>
    ${n.考试类型 ? '<div class="muted">考试类型：' + esc(n.考试类型) + '</div>' : ''}
    ${n.价值主张 ? '<p style="line-height:1.8">' + esc(n.价值主张) + '</p>' : ''}
    ${n.支撑 ? '<div class="tag">' + esc(n.支撑) + '</div>' : ''}
    ${n.系统对象 ? '<div class="muted">系统对象：' + esc(n.系统对象) + '</div>' : ''}
    ${n.相关表 ? '<div class="muted">相关数据表：' + esc(n.相关表) + '</div>' : ''}
    <h3 style="font-size:13px">相邻节点（${(d.edges || []).filter(e => e.from === nodeId || e.to === nodeId).length}）</h3>${near}
    ${n.page ? `<button class="btn btn-p btn-sm" style="margin-top:10px" onclick="goPage('${esc(n.page)}')">打开对应页面 →</button>` : ''}`;
}

function graphMapHtml(d, works, no, sel) {
  const nodes = d.nodes || [], edges = d.edges || [];
  const selId = sel || '';
  const cols = [
    { key: '工作', x: 20, w: 150 },
    { key: '流程步骤', x: 240, w: 170 },
    { key: '执行动作', x: 450, w: 170 },
    { key: '数据对象', x: 660, w: 170 },
  ];
  const groups = {};
  nodes.forEach(n => { (groups[n.type] = groups[n.type] || []).push(n); });
  const rowH = 40, top = 30;
  const maxRows = Math.max(...Object.values(groups).map(a => a.length), 1);
  const H = Math.max(maxRows * rowH + 80, 320);
  const pos = {};
  for (const [t, list] of Object.entries(groups)) {
    const col = cols.find(c => c.key === t) || cols[cols.length - 1];
    list.forEach((n, i) => { pos[n.id] = { x: col.x, y: top + i * rowH, w: col.w }; });
  }
  const isNear = id => !selId || selId === id || (edges || []).some(e =>
    (e.from === selId && e.to === id) || (e.to === selId && e.from === id));
  const svg = [`<svg viewBox="0 0 900 ${H}" style="width:100%;height:auto">`];
  for (const e of edges) {
    const a = pos[e.from], b = pos[e.to];
    if (!a || !b) continue;
    const active = !selId || selId === e.from || selId === e.to;
    svg.push(`<line x1="${a.x + a.w}" y1="${a.y + 16}" x2="${b.x}" y2="${b.y + 16}" fill="none"
      stroke="${active ? '#534AB7' : '#C9D2E0'}" stroke-width="${active ? 1.6 : 1}" ${active ? '' : 'opacity=".55"'}/>`);
  }
  for (const [nid, p] of Object.entries(pos)) {
    const n = nodes.find(x => x.id === nid);
    if (!n) continue;
    const dim = selId && selId !== nid &&
      !(edges || []).some(e => (e.from === selId && e.to === nid) || (e.to === selId && e.from === nid));
    const fill = n.type === '工作' ? '#EDEDFC' : n.type === '流程步骤' ? '#E1F5EE'
      : n.type === '数据对象' ? '#FAEEDA' : n.type === '执行动作' ? '#FCEBEB' : '#F1EFE8';
    svg.push(`<g style="cursor:pointer" onclick="S.filters.graphSel='${esc(nid)}';render()">
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="32" rx="8" fill="${fill}"
        stroke="${selId === nid ? '#534AB7' : '#B4B2A9'}" stroke-width="${selId === nid ? 1.6 : 0.6}" ${dim ? 'opacity=".45"' : ''}/>
      <text x="${p.x + p.w / 2}" y="${p.y + 20}" text-anchor="middle" font-size="11"
        fill="#2C2C2A">${esc(n.label.length > 14 ? n.label.slice(0, 14) + '…' : n.label)}</text></g>`);
  }
  svg.push('</svg>');
  const detail = selId ? graphNodeDetail(d, selId) : '<div class="empty">点图中任一节点，查看它的相邻节点与详情</div>';
  return `<div class="page-head"><div><h2>知识图谱 · ${esc(d.center.short)}</h2>
    <div class="hint">${esc(d.center.subject)} ｜ ${d.统计.节点} 个节点 / ${d.统计.边} 条边；节点挨着节点，点一个看它的相邻关系</div></div></div>
    <div class="banner"><b>选工作：</b>${works.map(x =>
      `<button class="btn ${x.no === no ? 'btn-p' : 'btn-g'} btn-sm" style="margin:2px" onclick="S.filters.graphNo='${x.no}';render()">${esc(x.short_name)}</button>`).join('')}</div>
    <div class="grid2" style="grid-template-columns:2fr 1fr">
      <div class="card" style="overflow-x:auto">${svg.join('')}</div>
      <div class="card">${detail}</div></div>
    <p class="muted">图例：🟪 工作 → 🟩 流程步骤 → 🟨 数据对象（挂相关数据表）→ ⬜ 执行动作。紫色连线是当前选中节点的相邻关系。</p>`;
}

/* 数据分析 · 七流分析（每条流的节点链与系统入口） */
async function sevenCenterPage() {
  const no = parseInt(S.filters.sevenNo || '1', 10);
  const d = await api('/api/work/seven/flows?no=' + no);
  const works = (await api('/api/work/works')).items;
  return `<div class="page-head"><div><h2>七流分析 · ${esc(d.work.short)}</h2>
    <div class="hint">调研表2：同一项工作的数据流 / 资金流 / 工作流 / 执行流 / 管控流 / 价值流 / 合规流</div></div></div>
    <div class="banner"><b>选工作：</b>${works.map(x =>
      `<button class="btn ${x.no === no ? 'btn-p' : 'btn-g'} btn-sm" style="margin:2px" onclick="S.filters.sevenNo='${x.no}';render()">${esc(x.short_name)}</button>`).join('')}</div>
    ${d.流名.map(name => sevenFlowView(d, name)).join('')}`;
}

/* 首页：我的工作总览 */
async function workOverview() {
  const d = await api('/api/work/dashboard');
  const list = (await api('/api/work/works')).items;
  return `<div class="page-head"><div><h2>我的工作 · 四流总览</h2>
    <div class="hint">按调研表 11 项工作组织：选一项工作 → 看四流 → 按步骤办理</div></div></div>
    <div class="banner">共 <b>${d.工作数}</b> 项工作、<b>${d.工作流步骤}</b> 个流程步骤、<b>${d.执行动作}</b> 个执行动作；
    其中 <b>${d.已支撑步骤}</b> 步已有系统功能，<b>${d.断链步骤}</b> 步待补。${esc(d.提示)}</div>
    <div class="card"><h3>演示数据（操作演示用）</h3>
      <div class="muted" style="margin-bottom:10px">一键给各功能页填入示例单据、凭证、合同、审计底稿、税务与工作流实例；演示完可一键清空，不影响你自己录入的数据。</div>
      <button class="btn btn-p btn-sm" onclick="demoSeed()">载入演示数据</button>
      <button class="btn btn-g btn-sm" onclick="demoClear()">清空演示数据</button>
      <button class="btn btn-g btn-sm" onclick="goPage('role_center')">看岗位与能力进阶 →</button></div>
    <div class="grid2">${list.map(x => `<div class="card">
      <h3>${esc(x.short_name)}</h3>
      <div class="muted" style="margin-bottom:8px">${esc(x.subject)} · ${esc(x.exam_type)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <span class="tag">${x.步骤数} 个步骤</span><span class="tag">${x.动作数} 个动作</span>
        <span class="tag t-posted">${x.已支撑步骤} 步已支撑</span>
        ${x.进行中 ? `<span class="tag t-posted">${x.进行中} 项在办</span>` : ''}</div>
      <button class="btn btn-p btn-sm" onclick="goPage('work_${x.no}')">进入工作台 →</button></div>`).join('')}</div>`;
}

/* 注册 11 个工作台页 + 替换首页为工作总览（保留原 KPI 在下方） */
/* 数据分析 · 岗位与能力进阶（调研表3：谁、按什么级别跑） */
async function rolePage() {
  const d = await api('/api/work/seven/roles');
  const list = await Promise.all(d.items.map(x => api('/api/work/seven/role?no=' + x.no)));
  return `<div class="page-head"><div><h2>岗位与能力进阶</h2>
    <div class="hint">调研表3：5 类岗位 × 七流核心动作 × 初级 / 中级 / 高阶能力梯度</div></div></div>
    <div class="banner">选一个岗位，看它每天要跑哪七条流、每一步做什么，以及从初级到高阶要补哪些能力。</div>
    ${list.map((x)=>`<div class="card"><h3>${esc(x.岗位.name)}</h3>
      <div class="muted" style="margin-bottom:8px">典型细分岗位：${esc(x.岗位.posts)}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${d.流名.map(f=>`<span class="tag">${esc(f)} ${(x.七流[f]||[]).length} 项</span>`).join('')}</div>
      <div class="muted" style="line-height:1.9;white-space:pre-wrap">${esc(x.岗位.knowledge)}</div>
      <h3 style="margin-top:12px">能力进阶梯度</h3>
      ${x.能力进阶.map(l=>`<div style="border-left:3px solid var(--primary);padding:8px 10px;margin-bottom:6px;background:var(--blue-bg);border-radius:0 6px 6px 0">
        <b>${esc(l.级别)}</b><div class="muted" style="font-size:12px">${esc(l.要求)}</div></div>`).join('')}
      <div style="margin-top:10px">${(x.关联工作||[]).map(w=>`<button class="btn btn-g btn-sm" style="margin:2px" onclick="goPage('work_${w.编号}')">相关工作台：${esc(w.简称)} →</button>`).join('')}</div>
    </div>`).join('')}</div>`;
}


/* ==================== 岗位分层导航（表3 能力进阶 → 系统分层） ====================
   业务操作优先：普通财务只见日常操作；分析/监管/战略随岗位层级逐级出现。 */
const NAV_LEVELS = {
  business: { name: '初级 · 业务操作（出纳 / 往来会计）', groups: [
    { title: '今日必办', pages: ['dashboard', 'todo'] },
    { title: '单据与凭证', pages: ['docs', 'vouchers', 'tpl', 'print', 'vcheck'] },
    { title: '现金与银行', pages: ['journal', 'daily', 'recon', 'cashier_tools'] },
    { title: '开票与收付款', pages: ['gateway_center'] },
    { title: '基础资料', pages: ['subjects', 'base'] },
  ]},
  manager: { name: '中级 · 核算与分析（总账 / 税务 / 主管）', groups: [
    { title: '财务报表与分析', pages: ['fin', 'cfstmt', 'ratios', 'compare', 'partner', 'baddebt'] },
    { title: '税务管理', pages: ['tax_center'] },
    { title: '期末与年度', pages: ['periods', 'yearend', 'snapshots'] },
    { title: '审计与法务配合', pages: ['audit_center', 'legal_center'] },
    { title: '外部协同管理', pages: ['gateway_center', 'stmtimport', 'office'] },
  ]},
  executive: { name: '高阶 · 决策与监管（总监 / CFO）', groups: [
    { title: '经营决策', pages: ['analysis', 'graph', 'advanced_center'] },
    { title: '金融监管', pages: ['reg_center'] },
    { title: '宏观经济', pages: ['macro_center'] },
    { title: '四流与知识图谱', pages: ['competency_center', 'seven_center', 'graph_map'] },
    { title: '系统与安全', pages: ['base', 'system', 'sec_center', 'arch_audit', 'help'] },
  ]},
};
const POSITION_ROLES = [
  { id: 'all', name: '全部功能（默认）' },
  { id: 'business', name: '出纳 / 往来会计（业务操作）' },
  { id: 'manager', name: '总账会计 / 税务 / 审计（核算与分析）' },
  { id: 'executive', name: '财务总监 / CFO（决策与监管）' },
];
function currentPosition() { return localStorage.getItem('position') || 'all'; }
function setPosition(p) { localStorage.setItem('position', p); render(); }

function navTreeHtml() {
  const pos = currentPosition() || 'all';
  // 全部功能模式：8 个大功能 → 全部小功能；岗位模式：只显示该档
  const GROUPS_ALL = [
    ['工作台 · 11 项工作', ['dashboard','work_1','work_2','work_3','work_4','work_5','work_6','work_7','work_8','work_9','work_10','work_11']],
    ['财务核算', ['docs','invoices','assets','vouchers','journal','books','fin','cfstmt','ratios','compare','daily','recon','periods','baddebt','yearend','collection','partner','subjects']],
    ['税务管理', ['tax_center']],
    ['数据分析', ['analysis','graph','graph_map','seven_center','competency_center','advanced_center','rules','macro_center']],
    ['法务 · 审计 · 监管', ['legal_center','audit_center','reg_center']],
    ['外部协同', ['gateway_center','stmtimport','office']],
    ['效率工具', ['todo','search','tpl','print','vcheck']],
    ['系统与安全', ['base','system','compliance','risk','audit','monitor','sec_center','arch_audit','help']],
  ];
  const lv = NAV_LEVELS[pos];
  const groups = pos === 'all' ? GROUPS_ALL : lv.groups;
  const rolesHtml = POSITION_ROLES.map(r =>
    `<button data-position="${r.id}" style="display:block;width:100%;text-align:left;${pos === r.id ? 'color:var(--primary);font-weight:500' : 'color:var(--text2)'}" onclick="setPosition('${r.id}')">${r.id === pos ? '● ' : '○ '}${esc(r.name)}</button>`).join('');
  let out = `<div data-navver="V217B"></div><details open style="border-bottom:1px solid var(--border)"><summary style="cursor:pointer;padding:8px 12px;font-size:12px">👤 岗位视角（当前：${esc((POSITION_ROLES.find(r=>r.id===pos)||{}).name||'全部功能')}，点击切换）</summary><div style="padding:4px 8px">${rolesHtml}</div></details>`;
  for (const [title, pages] of groups) {
    const btns = pages.map(p => `<button data-page="${p}" style="display:block;width:100%;text-align:left">${esc(NAV_LABEL[p] || p)}</button>`).join('');
    const openAttr = pos === 'all' ? ' open' : '';
    out += `<details${openAttr} style="border-bottom:1px solid var(--border)"><summary style="cursor:pointer;padding:9px 12px;font-size:12.5px;font-weight:500">${esc(title)}（${pages.length}）</summary><div>${btns}</div></details>`;
  }
  return out;
}
const NAV_LABEL = {
  dashboard: '今日工作台', docs: '业务单据', invoices: '发票管理', assets: '固定资产', vouchers: '凭证管理',
  journal: '现金银行日记账', books: '账簿与分析', compliance: '内控合规', office: '导入导出中心',
  monitor: '监控大屏', risk: '风险预警', audit: '审计中心（哈希链）', help: '帮助中心', partner: '往来账',
  fin: '财务报表', todo: '我的待办中心', search: '全局搜索', tpl: '常用凭证模板', print: '凭证打印',
  vcheck: '凭证合规体检', cfstmt: '现金流量表（正表）', ratios: '财务比率分析', compare: '同比环比分析',
  baddebt: '坏账准备计提', collection: '往来催收清单', snapshots: '报表快照归档', yearend: '年度结转',
  stmtimport: '对账单批量导入', subjects: '会计科目模板', analysis: '在线经营分析报告', rules: '分析规则配置',
  graph: '功能联动关系', base: '基础资料', system: '系统管理', role_center: '岗位与能力进阶',
  advanced_center: '高阶核算与模型', tax_center: '税务中心', gateway_center: '开票 / 网银协同',
  legal_center: '法务管理', audit_center: '内部审计', reg_center: '金融监管会计',
  macro_center: '宏观经济会计', arch_audit: '架构审计中心', sec_center: '安全中心',
  graph_map: '知识图谱', seven_center: '七流分析',
  work_1: '账务核算', work_2: '财务与预算', work_3: '合同法务（中级）', work_4: '集团与战略财务',
  work_5: '准则核算', work_6: '审计鉴证', work_7: '成本与估值', work_8: '商事合规',
  work_9: '全税种管理', work_10: '战略与风控', work_11: '重大项目综合',
};

/* ==================== 今日工作台（行动导向首页） ==================== */
async function todayDashboard() {
  const pos = currentPosition();
  const tasks = [];
  try {
    const t = await api('/api/todo');
    const n = (t.items || []).filter(x => x.status !== '已完成').length;
    tasks.push({ icon: '📋', label: '待办事项', n, page: 'todo' });
  } catch (e) {}
  try {
    const w = (await api('/api/work/runs')).items || [];
    const n = w.filter(x => x.status === '进行中').length;
    tasks.push({ icon: '🧭', label: '进行中的工作流', n, page: 'dashboard' });
  } catch (e) {}
  try {
    const d = await api('/api/work/demo/status');
    tasks.push({ icon: '🎬', label: d.已载入 ? '演示数据已载入（' + d.记录数 + ' 条，可清空）' : '演示数据未载入', n: d.记录数, page: 'dashboard', demo: true });
  } catch (e) {}
  if (pos !== 'business') {
    try {
      const g = await api('/api/work/gaps');
      tasks.push({ icon: '🕸', label: '四流断链（待补功能）', n: g.步骤数 + g.动作数, page: 'graph_map' });
    } catch (e) {}
    try {
      const a = await api('/api/work/seven/controls');
      tasks.push({ icon: '🛡', label: '管控流检查点', n: a.总数, page: 'seven_center' });
    } catch (e) {}
    try {
      const c = await api('/api/work/seven/compliance');
      tasks.push({ icon: '⚖', label: '合规法规清单', n: c.数量, page: 'seven_center' });
    } catch (e) {}
    try {
      const cov = await api('/api/competency/coverage');
      tasks.push({ icon: '🧭', label: '能力图谱完整度', n: (cov.整体完整度 ?? '—') + '%', page: 'competency_center' });
    } catch (e) {}
  }
  return `<div class="card"><h3>今日待我处理</h3>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">${tasks.map(x =>
      `<div style="flex:1;min-width:160px;border:1px solid var(--border);border-radius:8px;padding:12px;cursor:pointer" onclick="goPage('${x.page}')">
        <div style="font-size:20px">${x.icon}</div>
        <b style="font-size:13px">${esc(x.label)}</b>
        <div style="font-size:22px;color:var(--primary);margin-top:4px">${x.n}</div></div>`).join('')}</div></div>`;
}

/* 侧栏按岗位渲染（表3 能力进阶 → 系统分层），go() 跳转时同步高亮 */
function renderNav() {
  const el = $('navTree');
  if (!el) return;
  const pos = currentPosition();
  const lv = NAV_LEVELS[pos] || NAV_LEVELS.business;
  const roles = POSITION_ROLES.map(r =>
    `<button data-position="${r.id}" style="display:block;width:100%;text-align:left;${pos === r.id ? 'color:var(--primary);font-weight:500' : 'color:var(--text2)'}" onclick="setPosition('${r.id}')">${r.id === pos ? '● ' : '○ '}${esc(r.name)}</button>`).join('');
  let out = `<details open style="border-bottom:1px solid var(--border)"><summary style="cursor:pointer;padding:8px 12px;font-size:12px">👤 当前岗位视角</summary><div style="padding:4px 8px">${roles}</div></details>`;
  for (const g of lv.groups) {
    const btns = g.pages.map(p => `<button data-page="${p}" style="display:block;width:100%;text-align:left">${esc(NAV_LABEL[p] || p)}</button>`).join('');
    out += `<details${pos === 'business' && g.title === '今日必办' ? ' open' : ''} style="border-bottom:1px solid var(--border)"><summary style="cursor:pointer;padding:9px 12px;font-size:12.5px;font-weight:500">${esc(g.title)}</summary><div>${btns}</div></details>`;
  }
  el.innerHTML = out;
}try { renderNav(); } catch (e) { document.getElementById('navTree').innerHTML = '⚠ 侧栏渲染错误: ' + e.message; }

const _oldDashboard = PAGES.dashboard;

for (let i = 1; i <= 11; i++) {
  PAGES['work_' + i] = (n => () => workPage(n))(i);
}
PAGES.graph_map = graphMapPage;
PAGES.seven_center = sevenCenterPage;
PAGES.role_center = rolePage;
PAGES.work_overview = workOverview;
PAGES.dashboard = async () => (await todayDashboard()) + '<div style="margin-top:14px">' + (await _oldDashboard()) + '</div>';

/*==actions_base==*/
/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* ================= 交互动作 ================= */
async function loadMeta() { S.meta = await api('/api/meta'); }
function go(page) {
  S.page = page;
  try { if (location.hash.replace(/^#/, '') !== page) history.replaceState(null, '', '#' + page); } catch (e) {}
  document.querySelectorAll('aside button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('crumb').textContent = ({ dashboard: '工作台', docs: '业务单据', vouchers: '凭证管理', journal: '现金银行日记账',
    daily: '日结核对', recon: '银行对账', periods: '期末结账', reports: '报表中心',
    books: '账簿与分析', compliance: '内控合规', invoices: '发票管理', assets: '固定资产', office: '导入导出中心',
    monitor: '监控大屏', risk: '风险预警', audit: '审计中心', help: '帮助中心',
    partner: '往来账', fin: '财务报表',
    todo: '我的待办中心', search: '全局搜索', tpl: '常用凭证模板', print: '凭证打印',
    vcheck: '凭证合规体检', cfstmt: '现金流量表（正表）', ratios: '财务比率分析',
    compare: '同比环比分析', baddebt: '坏账准备计提', collection: '往来催收清单',
    snapshots: '报表快照归档', yearend: '年度结转', stmtimport: '对账单批量导入',
    subjects: '会计科目模板',
    analysis: '在线经营分析报告', rules: '分析规则配置', graph: '功能联动关系',
    acct_tools: '会计工具箱', cashier_tools: '出纳工作台', tax_center: '税务中心', gateway_center: '开票 / 网银协同', legal_center: '法务管理', audit_center: '内部审计',
    reg_center: '金融监管会计', macro_center: '宏观经济会计',
    competency_center: '需求与四流追踪', advanced_center: '高阶核算与模型',
    arch_audit: '架构审计中心', sec_center: '安全中心',
    base: '基础资料', system: '系统管理', role_center: '岗位与能力进阶', work_1: '账务核算', work_2: '财务与预算', work_3: '合同法务', work_4: '集团与战略财务', work_5: '准则核算', work_6: '审计鉴证', work_7: '成本与估值', work_8: '商事合规', work_9: '全税种管理', work_10: '战略与风控', work_11: '重大项目综合' })[page];
  render();
}
document.querySelectorAll('aside button').forEach(b => b.onclick = () => go(b.dataset.page));

async function render() {
  destroyCharts();
  if (S.timer) { clearInterval(S.timer); S.timer = null; }
  ['fDocType', 'fDocStatus', 'fKind', 'fMonth', 'fRecon', 'dMonth', 'officeTarget', 'bookPeriod', 'assetPeriod',
   'aFrom', 'aTo', 'aActor', 'aEntity', 'aQ', 'plCp', 'frPeriod'].forEach(id => {
    const el = $(id); if (el) S.filters[id] = el.value;
  });
  $('page').innerHTML = '<div class="empty">加载中…</div>';
  try {
    if (!S.meta) await loadMeta();
    $('page').innerHTML = await PAGES[S.page]();
    if (S.page === 'dashboard') {
      const [m, s] = await Promise.all([api('/api/reports/monthly'), api('/api/reports/subjects')]);
      chart('c1', { type: 'bar', data: { labels: m.items.map(x => x.period), datasets: [
        { label: '收入', data: m.items.map(x => x.income), backgroundColor: '#4472C4', borderRadius: 6 },
        { label: '支出', data: m.items.map(x => x.expense), backgroundColor: '#ED7D31', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false } });
      const top = s.items.filter(x => x.debit > 0).sort((a, b) => b.debit - a.debit).slice(0, 6);
      chart('c2', { type: 'doughnut', data: { labels: top.map(x => x.subject_name || x.subject_code),
        datasets: [{ data: top.map(x => x.debit), backgroundColor: ['#4472C4', '#ED7D31', '#70AD47', '#FFC000', '#7030A0', '#4BACC6'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } } });
    }
    if (S.page === 'reports') {
      const m = await api('/api/reports/monthly');
      chart('c1', { type: 'bar', data: { labels: m.items.map(x => x.period), datasets: [
        { label: '收入', data: m.items.map(x => x.income), backgroundColor: '#4472C4', borderRadius: 6 },
        { label: '支出', data: m.items.map(x => x.expense), backgroundColor: '#ED7D31', borderRadius: 6 },
        { label: '净流入', data: m.items.map(x => x.income - x.expense), backgroundColor: '#2E8B57', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false } });
    }
    if (S.page === 'monitor' && S._monitor) {
      const d = S._monitor;
      const dk = { color: '#9FB0CC', grid: { color: 'rgba(255,255,255,.08)' } };
      const dark = { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#C9D4EA' } } },
        scales: { x: dk, y: dk } };
      chart('mTrend', { type: 'bar', data: { labels: d.daily.map(x => x.journal_date.slice(5)), datasets: [
        { label: '流入', data: d.daily.map(x => x.income), backgroundColor: '#4472C4', borderRadius: 4 },
        { label: '流出', data: d.daily.map(x => x.expense), backgroundColor: '#ED7D31', borderRadius: 4 }] }, options: dark });
      chart('mMonths', { type: 'line', data: { labels: d.months.map(x => x.period), datasets: [
        { label: '收入', data: d.months.map(x => x.income), borderColor: '#60A5FA', backgroundColor: 'rgba(96,165,250,.12)', fill: true, tension: .35 },
        { label: '支出', data: d.months.map(x => x.expense), borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,.12)', fill: true, tension: .35 }] }, options: dark });
      chart('mProj', { type: 'doughnut', data: { labels: d.projects.map(x => x.name),
        datasets: [{ data: d.projects.map(x => x.debit), backgroundColor: ['#4472C4', '#ED7D31', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#38BDF8', '#94A3B8'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#C9D4EA' } } } } });
      S.timer = setInterval(() => { if (S.page === 'monitor') render(); else if (S.timer) clearInterval(S.timer); }, Math.max(5, d.refresh || 10) * 1000);
    }
    if (S.page === 'audit' && S._auditStats) {
      const st = S._auditStats;
      chart('aDay', { type: 'line', data: { labels: st.by_day.map(x => x.d), datasets: [
        { label: '操作量', data: st.by_day.map(x => x.n), borderColor: '#4472C4', backgroundColor: 'rgba(68,114,196,.12)', fill: true, tension: .35 }] },
        options: { responsive: true, maintainAspectRatio: false } });
      chart('aAction', { type: 'bar', data: { labels: st.by_action.map(x => x.action),
        datasets: [{ label: '次数', data: st.by_action.map(x => x.n), backgroundColor: '#4472C4', borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    }
    $('dbStatus').textContent = 'SQLite 已连接 · 迁移 v' + S.meta.migrations.length;
  } catch (e) {
    $('page').innerHTML = `<div class="card"><h3>加载失败</h3><p class="muted">${esc(e.message)}</p></div>`;
  }
}

/* 业务单据 */
function newDoc() {
  const body = `<div class="frow">
      <div><label>单据类型 *</label><select name="doc_type" id="dType" onchange="toggleAdvance()">
        ${Object.entries(DOC_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div><label>日期 *</label><input type="date" name="doc_date" value="${today()}"></div>
      <div><label>金额（元）*</label><input type="number" step="0.01" name="amount" placeholder="0.00"></div>
      <div><label>收付账户 *</label><select name="account_kind"><option value="cash">库存现金</option><option value="bank">银行存款</option></select></div>
    </div>
    <div class="frow">
      <div><label>对方科目 *</label><select name="subject_code">${subjOpts()}</select></div>
      <div><label>核算项目</label><select name="project_id">${projOpts()}</select></div>
      <div><label>往来单位</label><select name="counterparty_id">${cpOpts()}</select></div>
    </div>
    <div class="frow">
      <div><label>申请人 / 经办人</label><input name="applicant" value="${esc(actor())}"></div>
      <div><label>部门</label><input name="dept" placeholder="如 财务部"></div>
      <div id="advanceBox" style="display:none"><label>冲抵借款单</label><select name="advance_id" id="advanceSel"><option value="">—不冲抵，直接付款—</option></select></div>
    </div>
    <div><label>事由 / 摘要</label><input name="reason" placeholder="业务说明"></div>
    <p class="muted" style="margin-top:10px">保存后为「草稿」，需提交审批；审批通过后由出纳办理收付款，系统自动生成记账凭证并登记日记账。</p>`;
  openModal('新建业务单据', body, '保存草稿', async f => {
    const d = {
      doc_type: fd(f, 'doc_type'), doc_date: fd(f, 'doc_date'), amount: fnum(f, 'amount'),
      account_kind: fd(f, 'account_kind'), subject_code: fd(f, 'subject_code'),
      project_id: fd(f, 'project_id') || null, counterparty_id: fd(f, 'counterparty_id') || null,
      applicant: fd(f, 'applicant'), dept: fd(f, 'dept'), reason: fd(f, 'reason'),
      advance_id: fd(f, 'advance_id') || null
    };
    if (!d.subject_code) throw new Error('请选择对方科目');
    const r = await api('/api/docs', 'POST', d);
    closeModal(); toast('✓ ' + r.doc_no + ' 已保存为草稿'); render();
  });
  toggleAdvance();
}
async function toggleAdvance() {
  const box = $('advanceBox'); if (!box) return;
  const t = $('dType').value;
  box.style.display = t === 'reimbursement' ? 'block' : 'none';
  if (t === 'reimbursement') {
    const d = await api('/api/docs?type=advance');
    const sel = $('advanceSel');
    sel.innerHTML = '<option value="">—不冲抵，直接付款—</option>' + d.items
      .filter(x => x.status === 'settled').map(x => `<option value="${x.id}">${esc(x.doc_no)} ¥${money(x.amount)} ${esc(x.applicant || '')}</option>`).join('');
  }
}
async function actDoc(id, action) {
  if (action === 'delete' && !confirm('确定删除这张草稿单据？')) return;
  if (action === 'settle' && !confirm('确认已实际收付款？系统将生成凭证并登记日记账。')) return;
  try { await api(`/api/docs/${id}/${action}`, 'POST', { actor: actor() }); toast('✓ 操作成功'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 凭证 */
let lineCount = 2;
function lineRow(i) {
  return `<div class="line-row" id="ln${i}">
    <select name="subject_code_${i}">${subjOpts()}</select>
    <input type="number" step="0.01" name="debit_${i}" placeholder="借方金额">
    <input type="number" step="0.01" name="credit_${i}" placeholder="贷方金额">
    <button type="button" class="btn btn-r btn-sm" onclick="this.parentElement.remove();calcBalance()">×</button></div>`;
}
function addLine() { $('lines').insertAdjacentHTML('beforeend', lineRow(lineCount++)); calcBalance(); }
function calcBalance() {
  const f = $('modalForm'); if (!f) return;
  let dr = 0, cr = 0;
  for (let j = 0; j < lineCount; j++) {
    dr += parseFloat(f.elements['debit_' + j]?.value) || 0;
    cr += parseFloat(f.elements['credit_' + j]?.value) || 0;
  }
  const el = $('balHint');
  if (el) { el.textContent = `借方 ${money(dr)} / 贷方 ${money(cr)} ${Math.abs(dr - cr) < 0.005 ? '✓ 平衡' : '✗ 差额 ' + money(dr - cr)}`;
    el.style.color = Math.abs(dr - cr) < 0.005 && dr > 0 ? 'var(--green)' : 'var(--red)'; }
}
function newVoucher() {
  lineCount = 2;
  const body = `<div class="frow">
      <div><label>日期 *</label><input type="date" name="voucher_date" value="${today()}"></div>
      <div><label>凭证字</label><select name="voucher_type"><option>付</option><option>收</option><option>转</option></select></div>
      <div style="grid-column:span 2"><label>摘要</label><input name="summary" placeholder="业务摘要"></div>
    </div>
    <label>分录（至少两条，借贷必须平衡；涉及 1001 库存现金 / 1002 银行存款 的分录会自动登记日记账）</label>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 30px;gap:8px;font-size:12px;color:var(--text2);margin-bottom:5px">
      <span>会计科目</span><span>借方</span><span>贷方</span><span></span></div>
    <div id="lines">${lineRow(0)}${lineRow(1)}</div>
    <button type="button" class="btn btn-g btn-sm" onclick="addLine()">＋ 添加分录</button>
    <div id="balHint" style="text-align:right;font-size:13px;margin-top:8px"></div>
    <label style="margin-top:10px"><input type="checkbox" name="auto_post" style="width:auto"> 保存后直接过账（跳过审核）</label>`;
  openModal('新增记账凭证', body, '保存凭证', async f => {
    const lines = [];
    for (let j = 0; j < lineCount; j++) {
      const code = f.elements['subject_code_' + j]?.value;
      if (!code) continue;
      lines.push({ subject_code: code,
        debit: parseFloat(f.elements['debit_' + j]?.value) || 0,
        credit: parseFloat(f.elements['credit_' + j]?.value) || 0 });
    }
    const r = await api('/api/vouchers', 'POST', {
      voucher_date: fd(f, 'voucher_date'), voucher_type: fd(f, 'voucher_type'),
      summary: fd(f, 'summary'), maker: actor(),
      auto_post: f.elements['auto_post'].checked, lines
    });
    closeModal(); toast('✓ ' + r.voucher_no + ' 已保存'); render();
  });
  $('lines').addEventListener('input', calcBalance);
  calcBalance();
}
async function actVoucher(id, action) {
  if (action === 'void' && !confirm('确定作废该凭证？')) return;
  let payload = { actor: actor() };
  if (action === 'reverse') {
    const reason = prompt('请输入冲销原因（将写入审计日志）：', '更正错账');
    if (reason === null) return;
    if (!confirm('红字冲销将生成一张反向凭证并过账，原凭证保留且不可修改。确认继续？')) return;
    payload.reason = reason;
  }
  try { await api(`/api/vouchers/${id}/${action}`, 'POST', payload); toast('✓ 操作成功'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
async function attachVoucher(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg,.txt';
  input.onchange = async () => {
    const f = input.files[0]; if (!f) return;
    const buf = await f.arrayBuffer();
    let binary = ''; const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    try {
      await api('/api/documents/upload', 'POST', {
        filename: f.name, content: btoa(binary), actor: actor(), entity_type: 'voucher', entity_id: id
      });
      toast('✓ 附件已关联到凭证'); render();
    } catch (e) { toast('✗ ' + e.message, 4000); }
  };
  input.click();
}

/* 日记账 */
function newManual() {
  const body = `<div class="frow">
      <div><label>日期 *</label><input type="date" name="date" value="${today()}"></div>
      <div><label>方向 *</label><select name="direction"><option value="in">收款（借）</option><option value="out">付款（贷）</option></select></div>
      <div><label>金额 *</label><input type="number" step="0.01" name="amount"></div>
      <div><label>账户 *</label><select name="account_kind"><option value="cash">库存现金</option><option value="bank">银行存款</option></select></div>
    </div><div class="frow">
      <div><label>对方科目 *</label><select name="subject_code">${subjOpts()}</select></div>
      <div><label>项目</label><select name="project_id">${projOpts()}</select></div>
      <div><label>往来单位</label><select name="counterparty_id">${cpOpts()}</select></div>
      <div><label>摘要</label><input name="summary"></div>
    </div><p class="muted">后台自动生成一张收/付款凭证并立即过账，保证账证相符。</p>`;
  openModal('出纳直接登记', body, '登记并过账', async f => {
    await api('/api/journal/manual', 'POST', {
      date: fd(f, 'date'), direction: fd(f, 'direction'), amount: fnum(f, 'amount'),
      account_kind: fd(f, 'account_kind'), subject_code: fd(f, 'subject_code'),
      project_id: fd(f, 'project_id') || null, counterparty_id: fd(f, 'counterparty_id') || null,
      summary: fd(f, 'summary'), actor: actor()
    });
    closeModal(); toast('✓ 已登记并生成凭证'); render();
  });
}
async function setRecon(id, status) {
  try { await api(`/api/journal/${id}/recon`, 'POST', { status, actor: actor() }); toast('✓ 已更新'); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
async function batchRecon() {
  const qs = new URLSearchParams();
  const kind = S.filters.fKind, month = S.filters.fMonth, recon = S.filters.fRecon;
  if (kind) qs.set('kind', kind); if (month) qs.set('month', month); if (recon) qs.set('recon', recon);
  const d = await api('/api/journal?' + qs);
  const ids = d.items.filter(x => x.recon_status !== '已核对').map(x => x.id);
  if (!ids.length) return toast('没有待核对记录');
  if (!confirm(`将筛选结果中 ${ids.length} 笔流水标记为「已核对」？`)) return;
  try { await api('/api/journal/recon-batch', 'POST', { ids, status: '已核对', actor: actor() }); toast('✓ 已批量核对'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
function downloadCSV() { window.location.href = '/api/export/journal.csv'; }

/* 日结核对 */
async function setCheck(kind, date, amount) {
  if (amount === '') return;
  try { await api('/api/daily/check', 'POST', { date, account_kind: kind, amount: parseFloat(amount), actor: actor() }); toast('✓ 盘点数已保存'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 银行对账 */
function importStatements() {
  const body = `<label>对账单数据（每行一条：日期,摘要,收入,支出；金额留空表示 0）</label>
    <textarea name="text" rows="7" placeholder="2026-11-06,A客户货款,25000,&#10;2026-11-07,银行手续费,,85.5"></textarea>
    <div class="frow" style="margin-top:10px"><div><label>银行账户</label><select name="bank_account_id">${bankOpts()}</select></div></div>`;
  openModal('导入银行对账单', body, '导入', async f => {
    const lines = fd(f, 'text').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const items = lines.map(l => {
      const p = l.split(',').map(x => x.trim());
      return { date: p[0], description: p[1] || '', amount_in: parseFloat(p[2]) || 0,
               amount_out: parseFloat(p[3]) || 0, bank_account_id: fd(f, 'bank_account_id') };
    });
    if (!items.length) throw new Error('请填写对账单数据');
    const r = await api('/api/statements', 'POST', { items, actor: actor() });
    closeModal(); toast(`✓ 已导入 ${r.count} 条`); render();
  });
}
async function autoMatch() {
  try { const r = await api('/api/statements/match', 'POST', { actor: actor() }); toast(`✓ 自动匹配 ${r.matched} 笔`); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 结账 */
async function periodAct(period, action) {
  if (action === 'close' && !confirm(`确认对 ${period} 进行月末结账？结账后该期间将禁止新增和修改。`)) return;
  try { await api(`/api/periods/${period}/${action}`, 'POST', { actor: actor() });
    toast('✓ ' + (action === 'close' ? '已结账' : '已反结账')); await loadMeta(); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}

/* 基础资料 */
function newBase(table) {
  let extra = '';
  if (table === 'subjects') extra = `<div><label>科目编码 *</label><input name="code" placeholder="如 6604"></div>
    <div><label>类别</label><select name="category"><option>资产</option><option>负债</option><option>权益</option><option>成本</option><option>损益</option></select></div>
    <div><label>余额方向</label><select name="direction"><option>借</option><option>贷</option></select></div>`;
  if (table === 'counterparties') extra = `<div><label>类型</label><select name="kind"><option>客户</option><option>供应商</option><option>员工</option><option>其他</option></select></div>`;
  if (table === 'bank_accounts') extra = `<div><label>开户行</label><input name="bank_name"></div>
    <div><label>账号</label><input name="account_no"></div>
    <div><label>期初余额</label><input type="number" step="0.01" name="opening_balance" value="0"></div>`;
  openModal('新增基础资料', `<div><label>名称 *</label><input name="name"></div>
    <div class="frow" style="margin-top:10px">${extra}</div>`, '保存', async f => {
    const d = { name: fd(f, 'name'), actor: actor() };
    ['code', 'category', 'direction', 'kind', 'bank_name', 'account_no', 'opening_balance'].forEach(k => { if (f.elements[k]) d[k] = fd(f, k); });
    await api('/api/base/' + table, 'POST', d);
    closeModal(); await loadMeta(); toast('✓ 已新增'); render();
  });
}
async function delBase(table, id) {
  if (!confirm('确定停用？停用后不再出现在下拉选项中，历史数据不受影响。')) return;
  try { await api(`/api/base/${table}/${id}`, 'DELETE'); await loadMeta(); toast('✓ 已停用'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}

/* 系统管理 */
async function backupJSON() {
  try {
    const d = await api('/api/backup');
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'journal-pro-backup-' + today() + '.json'; a.click();
    toast('✓ 备份已下载');
  } catch (e) { toast('✗ ' + e.message, 3500); }
}
function restoreJSON(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try {
      const data = JSON.parse(r.result);
      if (!data.tables) throw new Error('备份文件格式不正确');
      if (!confirm('⚠ 恢复备份将覆盖当前全部业务数据（不可恢复），建议先备份。确定继续？')) return;
      const res = await api('/api/restore', 'POST', { confirm: true, data, actor: actor() });
      await loadMeta(); toast(`✓ 已迁移 ${res.restored} 行数据`); render();
    } catch (e) { toast('✗ ' + e.message, 4000); }
  };
  r.readAsText(f); input.value = '';
}
async function saveSettings() {
  const settings = {
    company_name: $('setCompany').value, cashier: $('setCashier').value,
    accountant: $('setAccountant').value, cash_opening: $('setCash').value
  };
  try {
    await api('/api/settings', 'POST', { settings, actor: actor() });
    await api('/api/recalc', 'POST', { actor: actor() });
    await loadMeta(); toast('✓ 参数已保存，余额已重算'); render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}

/* ---------- 固定资产 / 结转 / 期初 / 对账单 / 迁移 ---------- */
function newAsset() {
  const body = `<div class="frow">
      <div><label>资产编号</label><input name="asset_no" placeholder="留空自动生成"></div>
      <div><label>资产名称 *</label><input name="name"></div>
      <div><label>类别</label><select name="category"><option>电子设备</option><option>办公家具</option><option>机器设备</option><option>运输工具</option><option>房屋建筑物</option><option>其他</option></select></div>
      <div><label>购入日期 *</label><input type="date" name="purchase_date" value="${today()}"></div>
    </div><div class="frow">
      <div><label>原值（元）*</label><input type="number" step="0.01" name="original_value"></div>
      <div><label>残值率</label><input type="number" step="0.01" name="salvage_rate" value="0.05"></div>
      <div><label>折旧月数 *</label><input type="number" name="useful_life_months" value="60"></div>
      <div><label>开始计提期间</label><input type="month" name="start_period" value="${thisMonth()}"></div>
      <div><label>折旧费用科目</label><select name="expense_subject">${subjOpts('6602')}</select></div>
      <div><label>使用部门</label><input name="dept"></div>
    </div><div><label>备注</label><input name="note"></div>
    <p class="muted" style="margin-top:10px">直线法：月折旧额 = 原值 ×（1 − 残值率）÷ 折旧月数；计提时自动生成「借 费用 / 贷 累计折旧」凭证。</p>`;
  openModal('新增固定资产', body, '保存', async f => {
    await api('/api/assets', 'POST', {
      asset_no: fd(f, 'asset_no'), name: fd(f, 'name'), category: fd(f, 'category'),
      purchase_date: fd(f, 'purchase_date'), original_value: fnum(f, 'original_value'),
      salvage_rate: fd(f, 'salvage_rate'), useful_life_months: fd(f, 'useful_life_months'),
      start_period: fd(f, 'start_period'), expense_subject: fd(f, 'expense_subject'),
      dept: fd(f, 'dept'), note: fd(f, 'note'), actor: actor()
    });
    closeModal(); toast('✓ 资产已入账'); render();
  });
}
async function actAsset(id, action) {
  if (!confirm('确认将该资产标记为已清理？')) return;
  try { await api(`/api/assets/${id}/${action}`, 'POST', { actor: actor() }); toast('✓ 已处理'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
async function capitalizeAsset(id) {
  if (!confirm('确认生成购置凭证（借 固定资产 / 贷 银行存款，按原值入账）？')) return;
  try { await api(`/api/assets/${id}/capitalize`, 'POST', { actor: actor() }); toast('✓ 购置凭证已生成并过账'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
async function depreciate() {
  const period = $('assetPeriod')?.value || thisMonth();
  if (!confirm(`确认计提 ${period} 的固定资产折旧？系统将自动生成折旧凭证并过账。`)) return;
  try {
    const r = await api('/api/assets/depreciate', 'POST', { period, actor: actor() });
    toast(`✓ 已计提 ${r.count} 项，合计 ¥${money(r.total)}`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function carryForward(period) {
  if (!confirm(`确认对 ${period} 执行期末结转损益？将把损益类科目余额转入本年利润并生成凭证。`)) return;
  try {
    const r = await api(`/api/periods/${period}/carry-forward`, 'POST', { actor: actor() });
    toast(`✓ 结转完成，净额 ¥${money(r.net)}`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function editOpenings() {
  const period = S.filters.bookPeriod || thisMonth();
  const op = await api('/api/openings?period=' + period);
  const map = {}; op.items.forEach(x => map[x.subject_code] = x);
  const rows = S.meta.subjects.map(s => `<div style="display:grid;grid-template-columns:1fr 130px 130px;gap:8px;align-items:center;margin-bottom:5px">
      <span style="font-size:13px">${esc(s.code)} ${esc(s.name)} <span class="muted">(${esc(s.direction)}向)</span></span>
      <input type="number" step="0.01" name="dr_${s.code}" placeholder="借方" value="${map[s.code]?.debit || ''}">
      <input type="number" step="0.01" name="cr_${s.code}" placeholder="贷方" value="${map[s.code]?.credit || ''}">
    </div>`).join('');
  openModal(`期初建账 · ${period}`, `<div class="banner">从其他系统迁移时，把原系统期末余额按科目录入：资产/成本类填借方，负债/权益/收入类填贷方；借贷合计必须相等。</div>
    <div style="display:grid;grid-template-columns:1fr 130px 130px;gap:8px;font-size:12px;color:var(--text2);margin-bottom:6px"><span>科目</span><span>借方期初</span><span>贷方期初</span></div>
    <div style="max-height:380px;overflow:auto">${rows}</div>`, '保存期初', async f => {
    const rowsData = [];
    S.meta.subjects.forEach(s => {
      const dr = parseFloat(f.elements['dr_' + s.code]?.value) || 0;
      const cr = parseFloat(f.elements['cr_' + s.code]?.value) || 0;
      if (dr || cr) rowsData.push({ subject_code: s.code, debit: dr, credit: cr });
    });
    await api('/api/openings', 'POST', { period, rows: rowsData, actor: actor() });
    closeModal(); toast('✓ 期初余额已保存'); render();
  });
}
function partnerStmt(id, fmt) { window.location.href = `/api/export/partner.${fmt}?counterparty_id=${id}`; }
async function selfCheck() {
  try {
    const r = await api('/api/selfcheck');
    toast(r.ok ? '✓ 全部自检项通过' : `✗ ${r.items.filter(x => !x.pass).length} 项异常`, 4000);
    render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}
function exportPortable() { window.location.href = '/api/portable/export'; }
async function importPortable(input) {
  const f = input.files[0]; if (!f) return;
  const buf = await f.arrayBuffer();
  let binary = ''; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  if (!confirm('⚠ 导入整站迁移包将用包内数据库覆盖当前全部数据，确定继续？')) { input.value = ''; return; }
  try {
    const r = await api('/api/portable/import', 'POST', { content: btoa(binary), actor: actor() });
    await loadMeta(); toast(`✓ 已导入 ${r.tables} 张表、${r.attachments} 个附件`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}

/* 轻量 Markdown 渲染（帮助中心） */
function mdToHtml(md) {
  const lines = esc(md).split('\n');
  const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  let html = '', inTable = false, inUl = false;
  for (const raw of lines) {
    const L = raw.trimEnd();
    if (/^\|/.test(L)) {
      const cells = L.split('|').slice(1, -1).map(x => x.trim());
      if (/^[\s:\-|]+$/.test(L)) continue;
      if (!inTable) { html += '<table><thead><tr>' + cells.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>'; inTable = true; }
      else html += '<tr>' + cells.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
      continue;
    }
    if (inTable) { html += '</tbody></table>'; inTable = false; }
    if (/^### /.test(L)) html += '<h3>' + inline(L.slice(4)) + '</h3>';
    else if (/^## /.test(L)) html += '<h2>' + inline(L.slice(3)) + '</h2>';
    else if (/^# /.test(L)) html += '<h1>' + inline(L.slice(2)) + '</h1>';
    else if (/^>/.test(L)) html += '<blockquote>' + inline(L.replace(/^>\s?/, '')) + '</blockquote>';
    else if (/^[-*] /.test(L)) { if (!inUl) { html += '<ul>'; inUl = true; } html += '<li>' + inline(L.slice(2)) + '</li>'; }
    else if (/^\d+\. /.test(L)) { if (!inUl) { html += '<ul>'; inUl = true; } html += '<li>' + inline(L.replace(/^\d+\.\s*/, '')) + '</li>'; }
    else { if (inUl) { html += '</ul>'; inUl = false; }
      if (!L.trim()) continue;
      if (/^---+$/.test(L.trim())) { html += '<hr>'; continue; }
      html += '<p>' + inline(L) + '</p>'; }
  }
  if (inTable) html += '</tbody></table>';
  if (inUl) html += '</ul>';
  return html;
}

async function saveRisk() {
  try {
    await api('/api/risk/settings', 'POST', { settings: {
      risk_cash_floor: $('rk_cash').value, risk_bank_floor: $('rk_bank').value,
      risk_large_txn: $('rk_large').value, risk_safety_months: $('rk_months').value,
      risk_recon_days: $('rk_recon').value, risk_budget_warn: $('rk_budget').value,
      monitor_refresh: $('rk_refresh').value
    }, actor: actor() });
    await loadMeta(); toast('✓ 阈值已保存，预警与大屏刷新已更新'); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}

/* ---------- 发票 / 预算 / 内控动作 ---------- */
function newInvoice() {
  const body = `<div class="frow">
      <div><label>发票号码 *</label><input name="invoice_no" placeholder="如 FP202611001"></div>
      <div><label>发票代码</label><input name="invoice_code"></div>
      <div><label>类型 *</label><select name="kind"><option>进项</option><option>销项</option></select></div>
      <div><label>开票日期 *</label><input type="date" name="invoice_date" value="${today()}"></div>
    </div><div class="frow">
      <div><label>往来单位</label><select name="counterparty_id">${cpOpts()}</select></div>
      <div><label>不含税金额 *</label><input type="number" step="0.01" name="amount"></div>
      <div><label>税额</label><input type="number" step="0.01" name="tax_amount" value="0"></div>
      <div><label>入账科目</label><select name="subject_code">${subjOpts()}</select></div>
      <div><label>项目</label><select name="project_id">${projOpts()}</select></div>
    </div>
    <div><label>备注</label><input name="note" placeholder="业务说明"></div>
    <p class="muted" style="margin-top:10px">登记时会按「发票号码 + 类型」自动查重；生成凭证时进项记「借 费用/进项税、贷 应付账款」，销项记「借 应收账款、贷 收入/销项税」。</p>`;
  openModal('登记发票', body, '登记', async f => {
    await api('/api/invoices', 'POST', {
      invoice_no: fd(f, 'invoice_no'), invoice_code: fd(f, 'invoice_code'),
      kind: fd(f, 'kind'), invoice_date: fd(f, 'invoice_date'),
      counterparty_id: fd(f, 'counterparty_id') || null,
      amount: fnum(f, 'amount'), tax_amount: fnum(f, 'tax_amount'),
      subject_code: fd(f, 'subject_code') || null, project_id: fd(f, 'project_id') || null,
      note: fd(f, 'note'), actor: actor()
    });
    closeModal(); toast('✓ 发票已登记'); render();
  });
}
async function actInvoice(id, action) {
  if (action === 'void' && !confirm('确定作废该发票？')) return;
  if (action === 'post' && !confirm('确认由该发票生成记账凭证？')) return;
  try { await api(`/api/invoices/${id}/${action}`, 'POST', { actor: actor() }); toast('✓ 操作成功'); render(); }
  catch (e) { toast('✗ ' + e.message, 4000); }
}
function newBudget() {
  const body = `<div class="frow">
      <div><label>期间 *</label><input type="month" name="period" value="${thisMonth()}"></div>
      <div><label>科目（留空=全部）</label><select name="subject_code"><option value="">全部科目</option>${subjOpts()}</select></div>
      <div><label>项目（留空=全部）</label><select name="project_id">${projOpts()}</select></div>
      <div><label>预算金额 *</label><input type="number" step="0.01" name="amount"></div>
    </div><div><label>备注</label><input name="note"></div>`;
  openModal('设置预算', body, '保存', async f => {
    await api('/api/budgets', 'POST', {
      period: fd(f, 'period'), subject_code: fd(f, 'subject_code') || null,
      project_id: fd(f, 'project_id') || null, amount: fnum(f, 'amount'),
      note: fd(f, 'note'), actor: actor()
    });
    closeModal(); toast('✓ 预算已设置'); render();
  });
}
async function delBudget(id) {
  if (!confirm('确定删除该预算？')) return;
  try { await api('/api/budgets/' + id, 'DELETE'); toast('✓ 已删除'); render(); }
  catch (e) { toast('✗ ' + e.message, 3500); }
}
async function verifyChain() {
  try {
    const r = await api('/api/audit/verify');
    toast(r.intact ? `✓ 审计链完整：${r.total} 条记录全部校验通过` : `✗ 检测到 ${r.broken.length} 处异常`, 4000);
    render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}
async function saveCompliance() {
  try {
    await api('/api/settings', 'POST', { settings: {
      separate_duties: $('setDuties').checked ? '1' : '0',
      budget_control: $('setBudgetCtl').checked ? '1' : '0'
    }, actor: actor() });
    await loadMeta(); toast('✓ 内控设置已保存'); render();
  } catch (e) { toast('✗ ' + e.message, 3500); }
}

/* ---------- 导入导出中心动作 ---------- */
function exportSelected() {
  const keys = ['journal', 'docs', 'vouchers', 'voucher_lines', 'statements', 'daily',
    'subjects', 'projects', 'counterparties', 'bank_accounts', 'audit', 'periods',
    'invoices', 'budgets', 'attachments']
    .filter(k => $('ex_' + k)?.checked);
  if (!keys.length) return toast('请至少选择一张表');
  exportExcel(...keys);
}
async function onOfficeFile(input) {
  const f = input.files[0]; if (!f) return;
  const buf = await f.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  const content = btoa(binary);
  S.officeFilename = f.name; S.officeRaw = content; S.officePreview = null;
  try {
    S.officePreview = await api('/api/import/preview', 'POST', { filename: f.name, content });
    toast('✓ 文件解析完成');
  } catch (e) { toast('✗ ' + e.message, 4000); }
  render();
}
async function execImport() {
  const p = S.officePreview; if (!p || p.kind !== 'table') return;
  const target = $('officeTarget')?.value || S.filters.officeTarget || 'journal';
  if (!confirm(`确认把 ${Math.min(p.total, 200)} 行数据导入「${target}」？导入将生成正式业务数据。`)) return;
  try {
    const r = await api('/api/import/execute', 'POST', {
      target, rows: p.rows, actor: actor(), filename: S.officeFilename
    });
    S.officePreview = null;
    toast(`✓ 成功 ${r.success} 行${r.error_count ? '，失败 ' + r.error_count + ' 行' : ''}`, 4500);
    if (r.error_count) alert('部分行导入失败：\n' + r.errors.join('\n'));
    await loadMeta(); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function registerDoc() {
  try {
    const r = await api('/api/documents/upload', 'POST', {
      filename: S.officeFilename, content: S.officeRaw, actor: actor()
    });
    S.officePreview = null;
    toast(`✓ 已登记（${r.file_type}）`); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
function downloadDoc(id) { window.location.href = '/api/documents/' + id + '/download'; }


/*==actions_v25==*/
/* ================= V2.5 交互动作 ================= */

function newTpl() {
  const row = i => `<div class="frow"><div><label>科目 ${i}</label><select name="s${i}">${subjOpts()}</select></div>
    <div><label>借方金额</label><input type="number" step="0.01" name="d${i}"></div>
    <div><label>贷方金额</label><input type="number" step="0.01" name="c${i}"></div></div>`;
  openModal('新建常用凭证模板',
    `<div class="frow"><div><label>模板名称 *</label><input name="name" required placeholder="如：支付月度房租"></div>
     <div><label>默认摘要</label><input name="summary" placeholder="如：支付办公场地租金"></div></div>
     ${[1, 2, 3, 4].map(row).join('')}
     <p class="muted">至少填 2 行且借贷相等；留空的行自动忽略。模板只生成草稿凭证。</p>`,
    '保存模板', async f => {
      const lines = [];
      for (let i = 1; i <= 4; i++) {
        const code = fd(f, 's' + i), dr = fnum(f, 'd' + i), cr = fnum(f, 'c' + i);
        if (code && (dr || cr)) lines.push({ subject_code: code, debit: dr, credit: cr });
      }
      await api('/api/voucher-templates', 'POST',
        { name: fd(f, 'name'), summary: fd(f, 'summary'), lines, actor: actor() });
      closeModal(); toast('✓ 模板已保存'); render();
    });
}
async function useTpl(id) {
  if (!confirm('按此模板生成一张草稿凭证？生成后可在「凭证管理」审核过账。')) return;
  try {
    const r = await api('/api/voucher-templates/' + id + '/use', 'POST', { actor: actor() });
    toast('✓ 已生成 ' + r.voucher_no, 3500); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function delTpl(id) {
  if (!confirm('确定删除这个模板？已生成的凭证不受影响。')) return;
  await api('/api/voucher-templates/' + id, 'DELETE', { actor: actor() });
  toast('✓ 已删除'); render();
}
function printVouchers() {
  const ids = (S.filters.vIds || '').trim();
  window.open('/api/vouchers/print' + (ids ? '?ids=' + encodeURIComponent(ids) : ''));
}
async function saveBadDebtRates() {
  const rates = {};
  document.querySelectorAll('[data-rate]').forEach(el => {
    rates[el.dataset.rate] = (parseFloat(el.value) || 0) / 100;
  });
  try {
    await api('/api/bad-debt/config', 'POST', { rates, actor: actor() });
    toast('✓ 计提比例已保存'); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function doProvision(period) {
  if (!confirm(`确认按当前比例对 ${period} 生成坏账计提凭证？`)) return;
  try {
    const r = await api('/api/bad-debt/provision', 'POST', { period, actor: actor() });
    toast(`✓ ${r.action} ¥${money(r.amount)}，凭证 ${r.voucher_no}`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function saveSnapshot() {
  const period = ($('vPeriod') || {}).value || thisMonth();
  const note = ($('vNote') || {}).value || '';
  try {
    const r = await api('/api/snapshots', 'POST', { period, note, actor: actor() });
    toast(`✓ 已归档 ${r.period}（${r.all_pass ? '勾稽全部相符' : '存在不平项'}）`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function viewSnapshot(id) {
  const d = await api('/api/snapshots/' + id);
  const bs = d.data.balance_sheet || {}, inc = d.data.income || {}, art = d.data.articulation || {};
  openModal('报表快照 · ' + d.period,
    `<div class="stat-line"><span>归档时间</span><b>${esc(d.created_at)}</b></div>
     <div class="stat-line"><span>备注</span><b>${esc(d.note || '—')}</b></div>
     <div class="stat-line"><span>资产合计</span><b>¥${money(bs.total_assets)}</b></div>
     <div class="stat-line"><span>负债 + 权益</span><b>¥${money((bs.total_liabilities || 0) + (bs.total_equity || 0))}</b></div>
     <div class="stat-line"><span>资产负债表</span><b>${bs.balanced ? '✓ 平衡' : '✗ 差额 ' + money(bs.diff)}</b></div>
     <div class="stat-line"><span>本年累计净利润</span><b>¥${money(inc.net_cum)}</b></div>
     <div class="stat-line"><span>留抵收益</span><b>¥${money(bs.retained)}</b></div>
     <div class="stat-line"><span>三大勾稽</span><b>${art.all_pass ? '✓ 全部相符' : '✗ 存在不平项'}</b></div>
     <p class="muted" style="margin-top:8px">可点页面上的「⬇ Excel」导出这份历史快照。</p>`,
    '关闭', async () => closeModal());
}
async function delSnapshot(id) {
  if (!confirm('确定删除这份归档快照？')) return;
  await api('/api/snapshots/' + id, 'DELETE', { actor: actor() });
  toast('✓ 已删除'); render();
}
async function doYearEnd() {
  const year = ($('vYear') || {}).value || String(new Date().getFullYear());
  if (!confirm(`确认执行 ${year} 年度结转（4103 → 4104）？将生成并过账一张凭证，且该年度不可重复结转。`)) return;
  try {
    const r = await api('/api/periods/' + year + '/year-end-carry', 'POST', { actor: actor() });
    toast(`✓ ${r.direction} ¥${money(r.amount)}，凭证 ${r.voucher_no}`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 5000); }
}
async function previewStmtImport() {
  const text = ($('vCsv') || {}).value || '';
  if (!text.trim()) { toast('请先粘贴对账单内容'); return; }
  S.filters.vCsv = text;
  try {
    S.stmtPreview = await api('/api/statements/import', 'POST', { text, actor: actor() });
    toast(`✓ 解析 ${S.stmtPreview.total} 行，可导入 ${S.stmtPreview.new} 行`); render();
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function confirmStmtImport() {
  if (!S.stmtPreview || !S.stmtPreview.new) return;
  try {
    const r = await api('/api/statements/import', 'POST',
      { text: S.filters.vCsv || '', confirm: true, actor: actor() });
    S.stmtPreview = null;
    toast(`✓ 成功导入 ${r.imported} 行，跳过重复 ${r.duplicates} 行`, 4500); render();
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function applySubjects(key) {
  if (!confirm('确认套用该科目模板？只会补充缺失科目，不会修改已有科目。')) return;
  try {
    const r = await api('/api/subjects/apply-template', 'POST', { template: key, actor: actor() });
    await loadMeta();
    toast(`✓ 新增 ${r.added} 个科目`, 4000); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}



/*==actions_v26==*/
/* ================= V2.6 · 联动提示与规则配置 ================= */

function showImpacts(imp) {
  const box = $('impactBox');
  if (!box || !imp || !imp.affects || !imp.affects.length) return;
  box.innerHTML = `<div class="ib-head"><span>↗ 数据联动 · ${esc(imp.label)}</span>
    <button onclick="this.closest('.impact-box').classList.remove('show')">×</button></div>
    <div class="ib-sub">写入 ${esc((imp.writes || []).join(' / '))}，影响 ${imp.count} 项分析，相关页面已按新数据重算</div>
    ${imp.affects.map(a => `<div class="ib-row"><b>${esc(a.label)}</b><span>${esc(a.effect)}</span></div>`).join('')}`;
  box.classList.add('show');
  clearTimeout(box._t);
  box._t = setTimeout(() => box.classList.remove('show'), 12000);
}
async function saveAnalysisRules() {
  const list = id => (($(id) || {}).value || '').split(/[,，\s]+/).filter(Boolean);
  const rules = {
    liquidity: { noncurrent_asset: list('rl_nca'), current_liability: list('rl_cl'),
                 noncurrent_liability: list('rl_ncl'), inventory: list('rl_inv') },
    cashflow: { operating: list('cf_op'), investing: list('cf_inv'), financing: list('cf_fin'),
                unclassified: ($('cf_un') || {}).value || 'warn' },
    aging: { basis: ($('ag_basis') || {}).value || 'period_end', rates: {} },
    ratios: {}
  };
  document.querySelectorAll('[data-rate]').forEach(el => {
    rules.aging.rates[el.dataset.rate] = (parseFloat(el.value) || 0) / 100;
  });
  document.querySelectorAll('[data-th]').forEach(el => {
    const n = el.dataset.th, bound = el.dataset.bound, v = el.value.trim();
    rules.ratios[n] = rules.ratios[n] || {};
    rules.ratios[n][bound] = v === '' ? null : parseFloat(v);
  });
  try {
    await api('/api/analysis/rules', 'POST', { rules, actor: actor() });
    toast('✓ 规则已保存，全部报表 / 比率 / 报告按新口径重算', 4000);
  } catch (e) { toast('✗ ' + e.message, 4500); }
}
async function resetAnalysisRules() {
  if (!confirm('确认把全部分析规则恢复为系统默认？')) return;
  try {
    await api('/api/analysis/rules/reset', 'POST', { actor: actor() });
    toast('✓ 已恢复默认规则'); render();
  } catch (e) { toast('✗ ' + e.message, 4000); }
}
async function showImpactDetail(action) {
  const box = $('impactDetail');
  if (!box) return;
  try {
    const d = await api('/api/analysis/impacts?action=' + encodeURIComponent(action));
    box.innerHTML = `<p class="muted">写入表：${esc((d.writes || []).join(' / '))} · 共 ${d.count} 条影响链</p>` +
      table(d.affects, [
        { t: '下游功能', f: r => `<b>${esc(r.label)}</b>` },
        { t: '影响原因', f: r => `<span class="muted">${esc(r.effect)}</span>` },
      ], '该操作暂无下游影响');
  } catch (e) { box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}


/*==actions_v28==*/
/* V2.8+ 通用工具执行器。
   设计原则：面向业务人员——零 JSON、零代码、零英文键名；
   所有结果显示为中文表格与信息卡，输入为表单/下拉/文件选择。 */

/* ---------- 字段名中文字典（覆盖全部工作台的高频字段） ---------- */
const FIELD_CN = {
  id: '编号', period: '期间', year: '年度', month: '月份', date: '日期', count_date: '盘点日期',
  invoice_date: '开票日期', due_date: '到期日', issue_date: '出票日', journal_date: '流水日期',
  created_at: '创建时间', updated_at: '更新时间', exported_at: '导出时间', done_at: '完成时间',
  checked_at: '检查时间', generated_at: '生成时间', expires_at: '到期时间', at: '时间',
  name: '名称', company: '公司', company_name: '公司名称', title: '名称', label: '项目',
  buyer: '购买方', tax_id: '纳税人识别号', invoice_title: '发票抬头', address_phone: '地址电话',
  buyer_bank: '购买方开户行及账号', bank_name: '开户行', bank_account: '银行账号',
  account: '收款账号', payee: '收款人', counterparty: '往来单位', cp: '往来单位', cp_name: '单位名称',
  subject: '科目', subject_name: '科目名称', subject_code: '科目编码', item: '项目',
  dept: '部门', applicant: '申请人', actor: '操作人', operator: '操作员', maker: '制单人',
  status: '状态', cert_status: '认证状态', invoice_status: '发票状态', level: '级别',
  kind: '类型', type: '类型', category: '类别', dimension: '维度', dim_key: '维度', dim_value: '维度值',
  amount: '金额', total_amount: '价税合计', tax_amount: '税额', tax: '税额', payable: '应纳税额',
  paid: '已缴金额', prepaid: '已预缴', current_due: '本期应补', settlement: '汇算应补/退',
  revenue: '营业收入', cum_revenue: '累计收入', cum_profit: '累计利润', accounting_profit: '会计利润',
  profit: '利润', net_profit: '净利润', gross: '应发工资', net: '金额', net_pay: '实发工资',
  inflow: '流入', outflow: '流出', in_total: '流入合计', out_total: '流出合计', net_total: '净额',
  balance: '余额', book_amount: '账面金额', total: '合计', diff: '差额', change: '变动',
  change_pct: '变动幅度', error_pct: '误差', usage: '使用率', usage_pct: '执行率',
  rate: '税率', tax_rate: '税率', ratio: '比率', vat_ratio: '增值税税负率', cit_ratio: '所得税税负率',
  total_ratio: '综合税负率', monthly_outflow: '月均支出', monthly: '每月摊销', monthly_limits: '月度限额',
  months: '月数', safety: '安全', flag: '判定', score: '评分', grade: '等级',
  count: '数量', cnt: '笔数', total_p: '通过项', total_f: '失败项',
  low: '下限', high: '上限', limit: '上限', quick: '速算扣除数',
  value: '数值', predicted: '预测值', actual: '实际值', low_est: '悲观', high_est: '乐观',
  output_tax: '销项税额', input_tax: '进项税额', output_groups: '销项分组', input_certified: '已认证进项',
  input_uncertified: '待认证进项', input_transfer: '进项转出', certified_tax: '已认证税额',
  uncertified_tax: '未认证税额', surtax_total: '附加税费合计', surtaxes: '附加税费',
  sales_ex_tax: '不含税销售额', credit: '留抵税额', taxpayer_type: '纳税人类型',
  vat_payable: '应纳增值税', vat_ratio_target: '税负率目标', ratio_target: '控制区间',
  ratio_now: '本期税负率', target: '目标区间', precision: '精度',
  has_budget: '是否已设预算', budget: '年度预算', budget_total: '预算合计', actual_total: '累计实际',
  year_end_forecast: '年末预计', small_micro: '小微企业优惠', rate_pct: '税率',
  deductible: '可扣除金额', add_back: '需调增金额', spent: '发生额',
  limit_60pct: '发生额的60%', limit_05pct_revenue: '收入的0.5%', taxable_income: '应纳税所得额',
  adjustments: '纳税调整合计', adjustments_total: '调整合计',
  children_count: '子女人数', children_amount: '子女教育', elderly_amount: '赡养老人',
  housing_loan: '房贷利息', rent: '住房租金', education: '继续教育', medical: '大病医疗', other: '其他扣除',
  social_personal: '个人社保', fund_personal: '个人公积金', social_employer: '单位社保',
  housing_fund_rate: '公积金比例', special: '专项附加扣除', special_total: '专项附加合计',
  taxable_cum: '累计应纳税所得额', total_gross: '应发合计', total_tax: '代扣个税合计', total_net: '实发合计',
  cash: '库存现金', cash_limit: '现金限额', exceeded: '是否超限', monthly_outflow_avg: '月均支出',
  denominations: '面额张数', denominations_json: '面额明细', note: '备注', reason: '原因',
  hint: '说明', notice: '提示', rule: '计算规则', method: '计算方法', limitation: '局限性说明',
  sparse_hint: '数据提示', unit_note: '金额单位说明', precision_note: '精度说明',
  workflow: '操作流程', requirement: '所需条件', requirement_note: '前置条件',
  invoice_no: '发票号', invoice_code: '发票代码', bill_no: '票据号', doc_no: '单据号',
  voucher_no: '凭证号', batch_no: '批次号', bank_ref: '银行流水号', task_id: '任务编号',
  ref_no: '来源单据', ref_type: '来源类型', ref_id: '来源编号', payload: '任务内容',
  result: '回传结果', result_json: '处理结果', note_text: '说明',
  items: '明细', files: '文件', modules: '模块', matrix: '依赖关系', tiers: '分级',
  groups: '分组', detail: '明细', lines: '工资明细', batches: '近期批次',
  ready_invoice: '可开票单位数', ready_payment: '可付款单位数',
  invoice_pending: '待开票', invoice_exported: '已导出待开具', invoice_done: '已完成开票',
  payment_pending: '待付款', payment_exported: '已导出待付款',
  pending: '待处理', imported: '成功导入', duplicates: '重复跳过', updated: '已更新',
  linked: '已关联', created: '新增', done: '成功', failed: '失败', skipped: '跳过',
  ok: '是否成功', check: '校验通过', balanced: '是否平衡', all_pass: '全部通过',
  issues: '问题', alerts: '预警', abnormal: '异常项', stale: '长期未用', zombie: '从未使用',
  ex_tax: '不含税金额', ex_total: '不含税合计', tax_total: '税额合计', rate_pct_note: '税率说明',
  total_assets: '资产合计', total_liabilities: '负债合计', total_equity: '所有者权益',
  current_assets: '流动资产', current_liabilities: '流动负债', noncurrent_liabilities: '非流动负债',
  operating_net: '经营现金流净额', cash_to_profit: '现金利润比', in_out_ratio: '流入流出比',
  month: '月份', today: '今天', days: '天数', deadline: '截止日', tax: '税种',
  endpoints: '接口', routes: '接口数', total: '总数', size: '大小', lines_count: '行数',
  functions: '函数数', longest: '最长函数', sql: 'SQL 数', cycles: '循环依赖',
  violations: '分层违规', imports: '依赖模块', edges: '依赖边', by_layer: '分层统计',
  dimensions_list: '维度列表', capabilities: '可接入能力', api_capabilities: '可接入能力',
  mode: '对接方式', notice_text: '说明', enabled: '是否启用',
  calendar: '征期安排', cit_quarterly: '季度预缴', safety_months: '资金安全推演',
  config: '当前配置', precision_info: '精度', monthly_limits_note: '限额说明',
  ready: '就绪', need: '待补', missing: '缺失', fields: '字段',
  template: '模板', columns: '列', encoding: '编码', delimiter: '分隔符',
  header_rows: '表头行数', date_format: '日期格式', from: '开始', to: '结束',
  tax_portals: '官方入口', portals: '官方入口', workflow_note: '流程',
  query: '查询', search: '搜索', message: '消息', error: '错误',
  permissions: '权限', role: '角色', token: '会话令牌', active_sessions: '在线会话',
  surtax_city: '城建税率', surtax_edu: '教育费附加率', surtax_local: '地方教育附加率',
  cit_rate: '企业所得税率', taxpayer_type: '纳税人类型', region: '地区', action: '可以做什么',
  url: '官方网址', db_size_kb: '数据库大小(KB)', tables: '数据表数量', table_names: '数据表清单',
  python: '运行环境', records: '业务记录数', migrations: '数据库版本', audit_chain: '审计链',
  columns_json: '文件列', columns: '文件列', mode: '对接方式', workflow: '操作步骤',
  notice: '重要说明', requirement: '需要具备的条件', for: '适用场景', capability: '能力',
  precision: '计算精度', unit_note: '金额单位', monthly_limits: '每月扣除限额',
  denominations_json: '面额明细', items_count: '记录数', rate_pct: '税率',
  usage_pct: '限额占用率', current_due: '本期应补税额', small_micro: '是否享受小微优惠',
  total: '合计', total_gross: '应发合计', total_tax: '代扣个税合计', total_net: '实发合计',
  file: '文件', region_name: '地区', tax_name: '税种', requirement_text: '所需条件',
  need_login: '是否需登录', can_auto: '能否自动', link: '链接',

  description: '说明', requirement_list: '所需条件', updated_by: '修改人',
  count_total: '总计', invalid: '有问题的任务', normal_count: '区间内月份',
  amount_in: '收入金额', amount_out: '支出金额', matched: '已匹配',
  statement_date: '对账日期', description_text: '摘要',
};

const UNIT_HINT = {
  amount: '¥', total_amount: '¥', tax_amount: '¥', tax: '¥', payable: '¥', paid: '¥', prepaid: '¥',
  current_due: '¥', settlement: '¥', revenue: '¥', cum_revenue: '¥', cum_profit: '¥',
  accounting_profit: '¥', profit: '¥', net_profit: '¥', gross: '¥', net: '¥', inflow: '¥', outflow: '¥',
  in_total: '¥', out_total: '¥', net_total: '¥', balance: '¥', book_amount: '¥', total: '¥', diff: '¥',
  change: '¥', budget: '¥', budget_total: '¥', actual_total: '¥', year_end_forecast: '¥',
  deductible: '¥', add_back: '¥', spent: '¥', limit_60pct: '¥', limit_05pct_revenue: '¥',
  taxable_income: '¥', adjustments: '¥', month: '', amount_in: '¥', amount_out: '¥',
  social_personal: '¥', fund_personal: '¥', total_gross: '¥', total_tax: '¥', total_net: '¥',
  taxable_cum: '¥', children_amount: '¥', elderly_amount: '¥', housing_loan: '¥', rent: '¥',
  education: '¥', medical: '¥', other: '¥', cash: '¥', cash_limit: '¥', monthly_outflow: '¥',
  certified_tax: '¥', uncertified_tax: '¥', output_tax: '¥', input_tax: '¥', input_certified: '¥',
  input_uncertified: '¥', input_transfer: '¥', surtax_total: '¥', sales_ex_tax: '¥', credit: '¥',
  vat_payable: '¥', ex_tax: '¥', ex_total: '¥', tax_total: '¥', monthly: '¥',
  rate: '%', tax_rate: '%', ratio: '%', vat_ratio: '%', cit_ratio: '%', total_ratio: '%',
  change_pct: '%', error_pct: '%', usage: '%', usage_pct: '%', rate_pct: '%', score: '分',
};

const STATUS_WORDS = {
  ok: ['成功', 'good'], done: ['已完成', 'good'], passed: ['通过', 'good'],
  健康: ['健康', 'good'], 区间内: ['区间内', 'good'], 正常: ['正常', 'good'],
  已认证: ['已认证', 'good'], balanced: ['平衡', 'good'],
  failed: ['失败', 'bad'], 偏低: ['偏低（少缴风险）', 'warn'], 偏高: ['偏高（多缴）', 'warn'],
  关注: ['需关注', 'warn'], 异常波动: ['异常波动', 'warn'], 超支: ['超支', 'bad'],
  general: ['一般纳税人', 'info'], small: ['小规模纳税人', 'info'], file: ['文件模式（无需资质）', 'info'],
  api: ['官方直连模式（需资质）', 'info'], payment: ['付款', 'info'], statement: ['对账单', 'info'],
  receipt: ['收款', 'info'], invoice: ['开票', 'info'], success: ['成功', 'good'],
  pending: ['待处理', 'info'], exported: ['已导出', 'info'], draft: ['草稿', 'info'],
  待认证: ['待认证', 'info'], 不得抵扣: ['不得抵扣', 'warn'],
};

function cnField(k) {
  if (FIELD_CN[k]) return FIELD_CN[k];
  // 未登记字段：拆分驼峰/下划线，常见词根翻译，兜底显示原词（不再是 JSON 键语法）
  const parts = String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().split(/\s+/);
  const small = {total: '合计', count: '数量', num: '数', list: '列表', info: '信息', detail: '明细',
    data: '数据', item: '项目', key: '键', code: '编码', no: '编号', at: '时间', by: '操作人',
    db: '数据库', size: '大小', kb: '', table: '数据表', tables: '数据表', names: '清单', name: '名称',
    python: '运行环境', region: '地区', action: '操作', url: '网址', columns: '列', json: '明细',
    surtax: '附加税', city: '城建', edu: '教育费附加', local: '地方教育附加', cit: '企业所得税',
    tax: '税', ratio: '比率', rate: '税率', vat: '增值税', low: '下限', high: '上限', target: '目标',
    current: '本期', cum: '累计', total: '合计', gross: '应发', net: '实发', out: '流出', in: '流入',
    month: '月份', year: '年度', date: '日期', at: '时间', status: '状态', flag: '判定',
    bank: '银行', account: '账号', ref: '编号', id: '编号', type: '类型', kind: '类别',
    amount: '金额', count: '数量', pct: '比例', score: '评分', grade: '等级', alert: '预警',
    item: '项目', line: '明细', batch: '批次', cert: '认证', pending: '待处理', done: '已完成'};
  const mapped = parts.map(p => small[p] || '').filter(Boolean);
  return mapped.length ? mapped.join('') : parts.join(' ');
}

function fmtNum(v) {
  const n = Number(v) || 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVal(key, v) {
  if (v === null || v === undefined || v === '') return '<span class="muted">—</span>';
  if (typeof v === 'boolean') return v ? '<span class="tag t-posted">是</span>' : '<span class="tag">否</span>';
  if (typeof v === 'number') {
    const unit = UNIT_HINT[key] || '';
    if (unit === '¥') return '¥ ' + fmtNum(v);
    if (unit === '%') return v.toFixed(2) + ' %';
    if (unit === '分') return v.toFixed(0) + ' 分';
    return Number.isInteger(v) ? String(v) : fmtNum(v);
  }
  if (Array.isArray(v)) {
    if (!v.length) return '<span class="muted">无</span>';
    if (v.every(x => typeof x !== 'object')) {
      const tags = v.slice(0, 12).map(x => `<span class="tag t-posted">${esc(String(x))}</span>`).join(' ');
      return v.length > 12 ? tags + `<span class="muted"> …共 ${v.length} 项</span>` : tags;
    }
    return renderTable(v.slice(0, 20));
  }
  if (typeof v === 'object') return renderInfoCard(v);
  const s = String(v);
  if (/^\[.*\]$|^\{.*\}$/.test(s.trim())) {
    try {
      const parsed = JSON.parse(s);
      return fmtVal(key, parsed);
    } catch (e) { /* 不是标准 JSON 就当普通文字 */ }
  }
  if (STATUS_WORDS[s]) {
    const [label, tone] = STATUS_WORDS[s];
    const cls = tone === 'good' ? 't-posted' : tone === 'bad' ? 't-rejected' : tone === 'warn' ? 't-rejected' : '';
    return `<span class="tag ${cls}">${esc(label)}</span>`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return esc(s.slice(0, 19).replace('T', ' '));
  if (s.startsWith('http')) return `<a href="${esc(s)}" target="_blank" rel="noopener">打开官方页面 ↗</a>`;
  if (s.length > 120) return `<span class="muted">${esc(s.slice(0, 120))}…</span>`;
  return esc(s);
}

function pickColumns(rows) {
  const keys = new Set();
  rows.slice(0, 8).forEach(r => Object.keys(r).forEach(k => keys.add(k)));
  return [...keys].filter(k => {
    const v = rows[0][k];
    return v === null || ['string', 'number', 'boolean'].includes(typeof v);
  }).slice(0, 8);
}

function renderTable(rows) {
  if (!Array.isArray(rows) || !rows.length) return '<div class="empty">暂无数据</div>';
  if (typeof rows[0] !== 'object') return rows.map(x => `<span class="tag">${esc(String(x))}</span>`).join(' ');
  const cols = pickColumns(rows);
  if (!cols.length) return '<div class="empty">暂无可显示的字段</div>';
  return table(rows.slice(0, 30), cols.map(k => ({ t: cnField(k), f: r => fmtVal(k, r[k]) })), '暂无数据');
}

function renderInfoCard(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') return fmtVal('', obj);
  const entries = Object.entries(obj).filter(([, v]) => v !== null && v !== undefined);
  if (!entries.length) return '<div class="empty">无内容</div>';
  const simple = entries.filter(([, v]) => typeof v !== 'object');
  const complex = entries.filter(([, v]) => typeof v === 'object' && v !== null);
  let html = '';
  if (simple.length) {
    html += '<table><tbody>' + simple.map(([k, v]) =>
      `<tr><td style="width:38%;color:var(--text2)">${esc(cnField(k))}</td><td style="text-align:left">${fmtVal(k, v)}</td></tr>`).join('') + '</tbody></table>';
  }
  if (complex.length && depth < 2) {
    html += complex.map(([k, v]) => {
      const inner = Array.isArray(v) ? renderTable(v) : renderInfoCard(v, depth + 1);
      return `<div style="margin-top:12px"><b style="font-size:12.5px;color:var(--primary-dark)">${esc(cnField(k))}</b>${inner}</div>`;
    }).join('');
  }
  return html;
}

/* 结果主渲染：中文表格 + 信息卡，绝不出现 JSON 源码 */
function renderV28Result(d) {
  if (d === null || d === undefined) return '<div class="empty">没有返回内容</div>';
  const okBar = d && d.ok === true ? '<div class="tag t-posted" style="margin-bottom:8px">✓ 操作成功</div>' : '';
  if (typeof d !== 'object') return `<div class="card" style="margin:0">${fmtVal('', d)}</div>`;
  const ARRAY_KEYS = ['items', 'files', 'matrix', 'dimensions', 'modules', 'tiers', 'groups',
    'detail', 'lines', 'batches', 'alerts', 'issues', 'columns', 'calendar', 'capabilities',
    'api_capabilities', 'workflow', 'abnormal', 'revenue', 'net', 'cash', 'portals', 'items_list'];
  let arrayKey = ARRAY_KEYS.find(k => Array.isArray(d[k]) && d[k].length && typeof d[k][0] === 'object');
  let html = '';
  const rest = { ...d };
  if (arrayKey) {
    const rows = d[arrayKey];
    html += `<p class="muted" style="margin:0 0 8px">共 ${rows.length} 条记录${rows.length > 30 ? '（显示前 30 条）' : ''}</p>`;
    html += `<div style="overflow-x:auto">${renderTable(rows)}</div>`;
    delete rest[arrayKey];
  }
  const other = Object.entries(rest).filter(([k]) => !['ok', 'success'].includes(k));
  if (other.length) {
    html += `<div style="margin-top:${arrayKey ? '14px' : '0'}">${renderInfoCard(Object.fromEntries(other))}</div>`;
  }
  if (!html) html = '<div class="tag t-posted">✓ 操作成功</div>';
  if (d.ok === true && arrayKey === undefined) html = '<div class="tag t-posted" style="margin-bottom:8px">✓ 操作成功</div>' + html;
  return okBar + html;
}

function findV28Tool(id) {
  for (const g in V28_TOOLS) {
    const t = V28_TOOLS[g].find(x => x.id === id);
    if (t) return t;
  }
  return null;
}

/* ---------- 工具专用输入收集（业务人员看到的是表单，不是 JSON/CSV） ---------- */
function collectV28(t, id) {
  const body = {}, qs = [];
  const val = n => { const el = $('f_' + id + '_' + n); return el ? el.value : ''; };
  const put = (n, v, f) => {
    // GET / 下载类工具的参数一律放地址栏；POST 工具默认放表单，标 query 的字段放地址栏
    if (method === 'POST' && !(f && f.method === 'query')) body[n] = v;
    else qs.push(encodeURIComponent(n) + '=' + encodeURIComponent(v));
  };
  for (const f of (t.fields || [])) {
    let v = val(f.n);
    if (f.type === 'number') v = parseFloat(v) || 0;
    if (f.type === 'csvnum') v = String(v).split(/[,，]/).map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
    if (f.type === 'checkbox') v = document.getElementById('f_' + id + '_' + f.n)?.checked ? 'true' : 'false';
    if (f.type === 'file') continue;   // 文件内容单独异步读取
    if (f.type === 'json') {
      try { v = JSON.parse(v); } catch (e) { return { error: '「' + f.l + '」格式不对，请按示例填写' }; }
    }
    put(f.n, v, f);
  }
  // 面额张数 → 结构化对象（用户只填数字）
  if (t.denominations) {
    const d = {};
    t.denominations.forEach(n => { const x = parseFloat(val('den_' + n)) || 0; if (x > 0) d[String(n)] = x; });
    if (!Object.keys(d).length) return { error: '请至少填写一种面额的张数' };
    body.denominations = d;
  }
  // 结构化回传 → 组装成后端接受的 rows（不出现 JSON 文本）
  if (t.rowBuilder) {
    const row = {};
    t.rowBuilder.forEach(f => { row[f.n] = val(f.n); });
    body.rows = [row];
    delete body.text;
  }
  // 关联单位 ID 型字段
  if (body.enabled !== undefined) body.enabled = body.enabled === true || body.enabled === 'true';
  return { body, qs };
}

async function runV28(id) {
  const t = findV28Tool(id);
  if (!t) return;
  if (t.confirm && !confirm(`确认执行「${t.title}」？该操作会写入业务数据。`)) return;
  const method = t.method || 'GET';
  const collected = collectV28(t, id);
  if (collected.error) { toast('✗ ' + collected.error, 4000); return; }
  const { body, qs } = collected;
  // 文件选择：读取为文本
  const fileField = (t.fields || []).find(f => f.type === 'file');
  if (fileField) {
    const el = $('f_' + id + '_' + fileField.n);
    const file = el && el.files && el.files[0];
    if (!file) { toast('✗ 请先选择文件', 3500); return; }
    body.text = await file.text();
  }
  const out = $('out_' + id);
  const query = t.api + (qs.length ? '?' + qs.join('&') : '');
  if (t.download) { window.open(query); toast('✓ 已生成下载文件（浏览器新窗口）'); return; }
  const btn = document.querySelector(`#tool_${id} button.btn-p, #tool_${id} button.btn-g`);
  const oldLabel = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '处理中…'; }
  if (out) out.innerHTML = '<div class="muted">正在处理，请稍候…</div>';
  try {
    const d = await api(query, method, method === 'GET' ? undefined : body);
    if (out) out.innerHTML = renderV28Result(d);
    toast('✓ ' + t.title + ' 完成');
  } catch (e) {
    if (out) out.innerHTML = `<div class="tag t-rejected" style="display:block;padding:8px">✗ ${esc(e.message)}</div>`;
    toast('✗ ' + e.message, 4000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = oldLabel; }
  }
}

/* ---------- 全局中文功能搜索：输入想做的事，直接跳到对应卡片 ---------- */
function searchV28Tools(text) {
  const kw = String(text || '').trim().toLowerCase();
  if (kw.length < 1) return [];
  const out = [];
  for (const g in V28_TOOLS) {
    for (const t of V28_TOOLS[g]) {
      const hay = (t.title + ' ' + (t.desc || '') + ' ' + (V28_PAGES[g] || '')).toLowerCase();
      if (hay.includes(kw)) out.push({ group: g, page: V28_PAGES[g], id: t.id, title: t.title, desc: t.desc });
      if (out.length >= 10) return out;
    }
  }
  return out;
}
function showSearchResults(text) {
  const box = $('searchResults');
  if (!box) return;
  const list = searchV28Tools(text);
  if (!String(text || '').trim()) { box.innerHTML = ''; box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = list.length ? list.map(x =>
    `<div style="padding:7px 10px;border-bottom:1px solid var(--border);cursor:pointer" onclick="jumpToTool('${x.page}','${x.id}')">
      <b>${esc(x.title)}</b><div class="muted" style="font-size:11px">${esc(x.desc || '')}</div></div>`).join('')
    : '<div style="padding:10px" class="muted">没找到相关功能，换个词试试（如「开票」「盘点」「审计」）</div>';
}
function jumpToTool(page, id) {
  const box = $('searchResults');
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }
  const si = $('globalSearch');
  if (si) si.value = '';
  if (typeof go === 'function') go(page);
  setTimeout(() => gotoTool(id), 350);
}

/*==app==*/
/* 会计出纳系统 · 前端模块（由 public/app.js 按职责拆分，index.html 顺序加载） */
/* 启动：支持 #页面 深链接（便于收藏与直达，如 /#todo） */
const _hashPage = (location.hash || '').replace(/^#/, '');
if (_hashPage && PAGES[_hashPage]) S.page = _hashPage;
render();



(async()=>{
  try{
    go('dashboard');
    await new Promise(r=>setTimeout(r,600));
    console.log('PAGE_HTML:',String(POOL['page'].innerHTML).slice(0,700));
    const h=POOL['page'].innerHTML;
    console.log('含今日待我处理:',h.includes('今日待我处理'));
    console.log('含我的工作:',h.includes('我的工作'));
    console.log('navTree_len:',String(POOL['navTree'].innerHTML).length);
    console.log('navTree_含工作台组:',POOL['navTree'].innerHTML.includes('工作台'));
    console.log('ERROR_CARD:',h.includes('加载失败')||h.includes('加载错误'));
    const m=(h.match(/加载失败[^<]*|加载错误[^<]*/)||[])[0];
    if(m)console.log('错误内容:',m);
  }catch(e){console.log('EXCEPTION:',e.message.slice(0,200));}
})();
