const WEDDING_CONFIG = {
  groom: {
    // REPLACE: tên chú rể
    name: 'Phạm Đắc Dy',
    shortName: 'Dy',
    // REPLACE: tên bố mẹ chú rể
    father: 'Phạm Văn Dinh',
    mother: 'Hoàng Thị Lẫy',
    // REPLACE: địa chỉ nhà trai
    address: 'Khu phố Tân Hòa - Vĩnh Bảo - Hải Phòng',
  },
  bride: {
    // REPLACE: tên cô dâu
    name: 'Trần Huyền Trang',
    shortName: 'Trang',
    // REPLACE: tên bố mẹ cô dâu
    father: 'Trần Xuân Cường',
    mother: 'Nguyễn Thị Tâm',
    // REPLACE: địa chỉ nhà gái
    address: 'Lạc Long Quân - Tây Hồ - Hà Nội',
  },

  // REPLACE: địa danh dòng trên cùng section lời mời
  location: '',

  // REPLACE: ngày & giờ lễ chính (ISO 8601) — dùng cho countdown + lịch
  weddingDate: '2026-09-20T09:30:00',
  // REPLACE: tốc độ auto-scroll sau khi mở thiệp (giây để cuộn hết trang)
  autoScrollSeconds: 60,
  // REPLACE: dừng bao nhiêu giây ở ảnh cover trước khi bắt đầu tự cuộn
  autoScrollDelaySeconds: 0.2,

  invitationText: 'TRÂN TRỌNG BÁO TIN LỄ THÀNH HÔN CỦA',
  invitationParagraph:
    'Trong niềm hạnh phúc, chúng mình trân trọng kính mời bạn đến chung vui cùng gia đình trong ngày trọng đại. Sự hiện diện của bạn là niềm vinh hạnh cho chúng mình.',
  message: 'Cuộc sống quý giá không chỉ ở đích đến, mà còn ở những khoảnh khắc chia sẻ cùng nhau.',

  // REPLACE: câu trích tình yêu (section Love / You)
  quote: 'Loại bỏ tất cả những lời yêu thương hoa mỹ, có lẽ tình yêu thực sự là sự đồng hành lâu dài.',

  // REPLACE: ảnh dọc (tỉ lệ ~3:4). Thay file thật của bạn vào assets/img/ rồi sửa đường dẫn.
  photos: {
    intro: 'assets/img/ph-intro.svg',
    // cover: 'assets/img/ph-cover.svg',
    cover: 'assets/img/1.jpg',
    // invite: 'assets/img/ph-invite.svg',
    invite: 'assets/img/2.jpg',
    // countdown: 'assets/img/ph-countdown.svg',
    countdown: 'assets/img/3.jpg',
    // footer: 'assets/img/ph-footer.svg',
    footer: 'assets/img/10.jpg',
    // REPLACE: 2 ảnh cho section "Love / You"
    // love: 'assets/img/photo-1.svg',
    // you: 'assets/img/photo-2.svg',
    love: 'assets/img/4.jpg',
    you: 'assets/img/5.jpg',
    // REPLACE: ảnh đôi tròn cho nút nổi góc dưới-phải
    avatar: 'assets/img/photo-3.svg',
  },

  // REPLACE: album ảnh cưới (carousel + thumbnail)
  gallery: [
    // 'assets/img/ph-g1.svg',
    // 'assets/img/ph-g2.svg',
    // 'assets/img/ph-g3.svg',
    // 'assets/img/ph-g4.svg',
    'assets/img/6.jpg',
    'assets/img/7.jpg',
    'assets/img/8.jpg',
    'assets/img/9.jpg',    
  ],

  // REPLACE: file nhạc nền (.mp3) sạch, đặt trong assets/audio/ rồi trỏ vào đây
  music: 'assets/audio/bgm.mp3',

  // Khối tiệc (2 bên)
  events: {
    groom: {
      title: 'TIỆC CƯỚI NHÀ TRAI',
      weekday: 'THỨ BẢY', time: '10:30', date: '26 . 09 . 2026',
      // REPLACE: âm lịch (điền tay - hệ thống không tự tính)
      lunar: 'Tức ngày 16 tháng 08 năm Bính Ngọ',
      place: 'TẠI NHÀ HÀNG HƯƠNG SƠN', address: 'Khu phố Tân Hòa - Vĩnh Bảo - Hải Phòng',
      // REPLACE: link Google Maps nhà trai
      mapUrl: 'https://www.google.com/maps/place/Nh%C3%A0+H%C3%A0ng+H%C6%B0%C6%A1ng+S%C6%A1n/@20.6813425,106.4807734,17z/data=!3m1!4b1!4m6!3m5!1s0x31358b25edabec8f:0x646a17227fc703b!8m2!3d20.6813425!4d106.4807734!16s%2Fg%2F11csbd_xtx?entry=ttu&g_ep=EgoyMDI2MDgxNy4wIKXMDSoASAFQAw%3D%3D',
    },
    bride: {
      title: 'TIỆC CƯỚI NHÀ GÁI',
      weekday: 'CHỦ NHẬT', time: '17:30', date: '20 . 09 . 2026',
      // REPLACE: âm lịch
      lunar: 'Tức ngày 10 tháng 08 năm Bính Ngọ',
      place: 'TẠI TRUNG TÂM HỘI NGHỊ TIỆC CƯỚI SEN HỒNG 1', address: 'Số 614 Đường Lạc Long Quân - Tây Hồ - Hà Nội',
      // REPLACE: link Google Maps nhà gái
      mapUrl: 'https://www.google.com/maps/place/Trung+T%C3%A2m+H%E1%BB%99i+Ngh%E1%BB%8B+Ti%E1%BB%87c+C%C6%B0%E1%BB%9Bi+Sen+H%E1%BB%93ng/data=!4m2!3m1!1s0x0:0xcd303eeb928ea16c?sa=X&ved=1t:2428&ictx=111',

    },
  },

  // Nghi lễ
  ceremonies: {
    vuquy: {
      title: 'LỄ VU QUY', when: 'VÀO THỨ BẢY - 06H30',
      month: 'THÁNG 09', day: '26', year: 'NĂM 2026',
      lunar: 'Tức ngày 16 tháng 08 năm Bính Ngọ',
      place: 'TẠI TƯ GIA NHÀ GÁI',       mapUrl: 'https://www.google.com/maps/place/Trung+T%C3%A2m+H%E1%BB%99i+Ngh%E1%BB%8B+Ti%E1%BB%87c+C%C6%B0%E1%BB%9Bi+Sen+H%E1%BB%93ng/data=!4m2!3m1!1s0x0:0xcd303eeb928ea16c?sa=X&ved=1t:2428&ictx=111',

    },
    thanhhon: {
      title: 'LỄ THÀNH HÔN', when: 'VÀO THỨ BẢY - 10H30',
      month: 'THÁNG 09', day: '26', year: 'NĂM 2026',
      lunar: 'Tức ngày 16 tháng 08 năm Bính Ngọ',
      place: 'TẠI TƯ GIA NHÀ TRAI',       mapUrl: 'https://www.google.com/maps/place/Nh%C3%A0+H%C3%A0ng+H%C6%B0%C6%A1ng+S%C6%A1n/@20.6813425,106.4807734,17z/data=!3m1!4b1!4m6!3m5!1s0x31358b25edabec8f:0x646a17227fc703b!8m2!3d20.6813425!4d106.4807734!16s%2Fg%2F11csbd_xtx?entry=ttu&g_ep=EgoyMDI2MDgxNy4wIKXMDSoASAFQAw%3D%3D',

    },
  },

  gift: {
    groom: {
      // REPLACE: thông tin nhận mừng cưới - chú rể
      name: 'PHẠM ĐẮC DY', bank: 'VIETINBANK', account: '105002523858',
      qrImage: 'assets/img/QR_cr.jpg',
    },
    bride: {
      // REPLACE: thông tin nhận mừng cưới - cô dâu
      name: 'TRẦN HUYỀN TRANG', bank: 'VPBANK', account: '35112626',
      qrImage: 'assets/img/QR_cd.jpg',
    },
  },

  // REPLACE: dòng credit ở footer
  footerCredit: 'Thiệp cưới online — thực hiện bởi gia đình',
};

window.WEDDING_CONFIG = WEDDING_CONFIG;
