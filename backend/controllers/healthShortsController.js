const healthShortsData = [
  {
    id: 'hs1',
    type: 'video',
    category: 'Hydration',
    text_hi: 'दिन में कम से कम 8 ग्लास पानी पियें।',
    text_en: 'Drink at least 8 glasses of clean water every day.',
    video_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  },
  {
    id: 'hs2',
    type: 'tip',
    category: 'Nutrition',
    text_hi: 'हर भोजन में ताजे फल और सब्ज़ियाँ शामिल करें।',
    text_en: 'Include fresh fruits and vegetables in every meal.',
    video_url: null,
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  },
  {
    id: 'hs3',
    type: 'video',
    category: 'Prevention',
    text_hi: 'हाथों को सही तरीके से साबुन से धोएं।',
    text_en: 'Wash your hands thoroughly with soap and water.',
    video_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  },
  {
    id: 'hs4',
    type: 'tip',
    category: 'Sleep',
    text_hi: 'रात में 7-8 घंटे की नींद लें।',
    text_en: 'Get 7-8 hours of sleep every night.',
    video_url: null,
    audio_url: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
    doctor_verified: true
  }
];

const getHealthShorts = async (req, res) => {
  try {
    return res.status(200).json(healthShortsData);
  } catch (error) {
    console.error('HealthShorts fetch failed:', error);
    return res.status(500).json({ message: 'Unable to fetch health shorts.' });
  }
};

module.exports = {
  getHealthShorts
};
