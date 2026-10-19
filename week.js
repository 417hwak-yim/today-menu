const WEEK = {
  updated: "2026-10-19 14:00",
  note: "오늘은 엄마랑 둘이서 파에야 먹는 날! 애호박이랑 양파를 작게 썰어서 같이 볶아요.",

  inventory: [
    {id:"paella", name:"오징어먹물 파에야 키트", amount:1, unit:"개", storage:"냉장", expiry:"2026-10-19", estimated:true, tip:"오늘 저녁에 써요."},
    {id:"tomato", name:"방울토마토", amount:null, unit:"", storage:"냉장", expiry:"2026-10-23", estimated:true, tip:"꼭지를 떼고 키친타월을 깐 통에 담으면 더 오래가요."},
    {id:"zucchini", name:"애호박", amount:1, unit:"개", storage:"냉장", expiry:"2026-10-22", estimated:true, tip:"자른 면은 랩으로 싸서 2~3일 안에 써요."},
    {id:"tofu", name:"두부", amount:1, unit:"모", storage:"냉장", expiry:"2026-10-21", estimated:true, tip:"개봉하면 물에 담가 냉장하고 이틀 안에 써요."},
    {id:"enoki", name:"팽이버섯", amount:1, unit:"봉", storage:"냉장", expiry:"2026-10-22", estimated:true, tip:"밑동을 자르지 말고 키친타월로 감싸 보관해요."},
    {id:"greenonion", name:"대파", amount:null, unit:"", storage:"냉장", expiry:"2026-10-26", estimated:true, tip:"썰어서 통에 담아 냉동하면 한 달은 써요."},
    {id:"onion", name:"양파", amount:null, unit:"", storage:"실온", expiry:"2026-11-02", estimated:true, tip:"감자와 떨어뜨려 서늘한 곳에 두세요."},
    {id:"carrot", name:"당근", amount:null, unit:"", storage:"냉장", expiry:"2026-10-30", estimated:true, tip:"물기를 닦고 키친타월로 싸서 냉장해요."}
  ],

  days: [
    {date:"2026-10-19", people:"어른 1 + 아이 2", breakfast:"", dinner:"오징어먹물 파에야",
     side:"방울토마토, 두부 계란국(선택)", uses:["파에야 키트","양파 1/2개","애호박 1/2개","팽이버섯 조금"],
     use:[{id:"paella", amount:1}, {id:"zucchini", amount:0.5}, {id:"enoki", amount:0.3}, {id:"onion", amount:0.5}, {id:"tomato", amount:0}],
     note:"키트가 2인분이면 밥 한두 공기를 육수와 함께 더 넣어요.",
     steps:["양파와 애호박을 쌀알보다 조금 크게 깍둑썰어요.","팬에 기름을 두르고 양파를 볶다가 애호박을 넣어 2~3분 볶아요.","키트 설명서대로 쌀, 해산물, 소스를 넣어요.","육수를 부은 뒤 팽이버섯을 위에 올려요.","마지막 1~2분 불을 세게 올리면 바닥이 바삭해져요."]},
    {date:"2026-10-20", people:"4명", breakfast:"시리얼 + 우유 + 방울토마토", dinner:"간장 불고기 덮밥 + 애호박 두부 된장국",
     uses:["양념 돼지고기 600g","애호박 1/2개","두부 1/2모","양파","대파"],
     use:[{id:"pork", amount:600, label:"양념 돼지고기"}, {id:"zucchini", amount:0.5}, {id:"tofu", amount:0.5}, {id:"onion", amount:1}, {id:"greenonion", amount:1}],
     buy:["양념 돼지고기 (화요일 전단 할인, 간장 양념인지 확인)"],
     alt3:"3명이면 불고기 150g쯤 남겨 목요일 볶음밥에 넣어요.", diet:"밥 반 공기, 된장국에 두부 넉넉히.",
     prep:"밥을 넉넉히 해두면 내일 아침 김 싼 밥이 돼요."},
    {date:"2026-10-21", people:"4명", breakfast:"김 싼 밥 + 삶은 계란", dinner:"소고기뭇국 + 계란말이",
     uses:["소고기 국거리 200g","무 1/3개","팽이버섯","대파","남은 두부"],
     use:[{id:"beef", amount:200, label:"소고기 국거리"}, {id:"radish", amount:0.3, label:"무"}, {id:"enoki", amount:0.7}, {id:"tofu", amount:0.5}, {id:"greenonion", amount:1}],
     buy:["소고기 국거리 약 300g (수요일 전단 할인)","무 1개 (수요일 전단 할인)"],
     alt3:"뭇국을 넉넉히 남겨 목요일에 먹어요.", diet:"뭇국은 그대로, 밥만 반 공기."},
    {date:"2026-10-22", people:"4명", breakfast:"냉동빵 + 크림치즈", dinner:"소고기 당근 계란볶음밥 + 남은 뭇국",
     uses:["남은 소고기 100g","당근","대파","계란"],
     use:[{id:"beef", amount:100, label:"소고기 국거리"}, {id:"carrot", amount:1}, {id:"greenonion", amount:1}],
     diet:"볶기 전에 밥 없이 소고기·채소·계란만 먼저 덜어두기.",
     prep:"주말 면 재료(라면, 우동면, 어묵, 스파게티)가 있는지 확인해요."},
    {date:"2026-10-23", people:"4명", breakfast:"시리얼 + 우유 + 과일", dinner:"재고 사진을 받은 뒤 정해요", note:"방울토마토는 오늘까지 다 먹어요."},
    {date:"2026-10-24", people:"4명", breakfast:"유부초밥", lunch:"어묵 우동", dinner:"재고 사진을 받은 뒤 정해요", note:"외식하면 계획한 재료는 다음 날로 넘겨요."},
    {date:"2026-10-25", people:"4명", breakfast:"브리또", lunch:"스파게티 (남은 채소 넣기)", dinner:"재고 사진을 받은 뒤 정해요",
     prep:"압력솥으로 계란 10개와 고구마를 쪄두면 평일 아침과 간식이 편해요."}
  ],

  leftovers: [
    {name:"애호박 1/2개", by:"2026-10-20", how:"화요일 저녁 된장국"},
    {name:"두부 1/2모", by:"2026-10-21", how:"화요일 된장국, 남은 반 모는 수요일 뭇국"},
    {name:"팽이버섯 남은 것", by:"2026-10-21", how:"수요일 소고기뭇국"},
    {name:"방울토마토", by:"2026-10-23", how:"매일 아침이나 저녁 곁들임"},
    {name:"무 2/3개 (수요일에 산 것)", by:"2026-10-28", how:"주말 무조림이나 무나물"}
  ],

  flyer: {
    store: "동네 마트 전단 (사진이 작아 일부만 읽었어요)",
    images: [],
    items: [
      {from:"2026-10-19", to:"2026-10-19", name:"방울토마토", sure:false},
      {from:"2026-10-19", to:"2026-10-19", name:"키위", sure:false},
      {from:"2026-10-19", to:"2026-10-19", name:"가지", sure:false},
      {from:"2026-10-19", to:"2026-10-19", name:"생선", sure:false},
      {from:"2026-10-20", to:"2026-10-20", name:"양념 돼지고기", sure:false},
      {from:"2026-10-20", to:"2026-10-20", name:"오이", sure:false},
      {from:"2026-10-21", to:"2026-10-21", name:"소고기", sure:false},
      {from:"2026-10-21", to:"2026-10-21", name:"무", sure:false},
      {from:"2026-10-21", to:"2026-10-21", name:"당근", sure:false},
      {from:"2026-10-21", to:"2026-10-21", name:"바나나", sure:false}
    ]
  },

  shopping: [
    {id:"s1", date:"2026-10-20", when:"화", name:"양념 돼지고기", amount:"4인분 약 600g", why:"화요일 불고기 덮밥", sale:"화 전단 할인",
     guide:"간장 양념인지 꼭 확인 (고추장이면 아이들이 못 먹어요)",
     add:{id:"pork", name:"양념 돼지고기", amount:600, unit:"g", storage:"냉장", days:2, tip:"당일 안 먹을 건 바로 냉동"}},
    {id:"s2", date:"2026-10-21", when:"수", name:"소고기 국거리", amount:"약 300g", why:"수요일 뭇국, 목요일 볶음밥", sale:"수 전단 할인",
     guide:"뭇국에 200g, 볶음밥에 100g",
     add:{id:"beef", name:"소고기 국거리", amount:300, unit:"g", storage:"냉장", days:2, tip:"목요일에 못 쓸 것 같으면 수요일에 바로 냉동"}},
    {id:"s3", date:"2026-10-21", when:"수", name:"무", amount:"1개", why:"수요일 뭇국, 주말 무조림", sale:"수 전단 할인",
     guide:"신문지에 싸서 김치냉장고에 두면 1주일 이상 가요",
     add:{id:"radish", name:"무", amount:1, unit:"개", storage:"김치냉장고", days:10, tip:"자른 면은 랩으로 싸요"}}
  ],

  tips: [
    "고구마와 감자는 김치냉장고에 넣지 말고 팬트리처럼 서늘하고 어두운 곳에 두세요.",
    "개봉한 우유는 3~4일, 크림치즈는 1~2주 안에 먹어요."
  ]
};
