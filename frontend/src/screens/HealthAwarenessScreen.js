import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Linking,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { imageConfig, fallbackImage } from '../config/imageConfig';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'common_diseases', labelEn: 'Common Diseases', labelHi: 'सामान्य बीमारियां' },
  { id: 'mother_child', labelEn: 'Mother & Child', labelHi: 'माँ और बच्चा' },
  { id: 'nutrition', labelEn: 'Nutrition', labelHi: 'पोषण' },
  { id: 'hygiene_sanitation', labelEn: 'Hygiene & Sanitation', labelHi: 'स्वच्छता' },
  { id: 'seasonal_diseases', labelEn: 'Seasonal Diseases', labelHi: 'मौसमी बीमारियां' }
];

const DAILY_QUESTION_UI = {
  en: {
    title: "Daily Question",
    yes: "Yes",
    no: "No",
    thanks: "Thank you for answering!"
  },
  hi: {
    title: "आज का सवाल",
    yes: "हाँ",
    no: "नहीं",
    thanks: "जवाब देने के लिए धन्यवाद!"
  }
};

const QUESTIONS_LIST = [
  { en: "Do you wash your hands before drinking water?", hi: "क्या आप पानी पीने से पहले हाथ धोते हैं?" },
  { en: "Do you drink boiled or filtered water?", hi: "क्या आप उबला हुआ या छाना हुआ पानी पीते हैं?" },
  { en: "Do you use a mosquito net while sleeping?", hi: "क्या आप सोते समय मच्छरदानी का उपयोग करते हैं?" },
  { en: "Do you cover your food to protect it from flies?", hi: "क्या आप खाने को मक्खियों से बचाने के लिए ढक कर रखते हैं?" },
  { en: "Do you cut your nails regularly to keep them clean?", hi: "क्या आप साफ रखने के लिए नियमित रूप से अपने नाखून काटते हैं?" },
  { en: "Do you wash vegetables and fruits before eating or cooking?", hi: "क्या खाने या पकाने से पहले आप सब्जियों और फलों को धोते हैं?" },
  { en: "Do you keep your house and surroundings clean?", hi: "क्या आप अपने घर और आसपास की सफाई रखते हैं?" },
  { en: "Do you properly dispose of garbage?", hi: "क्या आप कूड़े का सही तरीके से निपटान करते हैं?" },
  { en: "Do you avoid eating uncovered street food?", hi: "क्या आप बिना ढका हुआ बाहर का खाना खाने से बचते हैं?" },
  { en: "Do you brush your teeth every morning?", hi: "क्या आप रोज सुबह अपने दांतों को ब्रश करते हैं?" },
  { en: "Do you drink at least 8 glasses of water a day?", hi: "क्या आप दिन में कम से कम 8 गिलास पानी पीते हैं?" },
  { en: "Do you use a clean toilet instead of going out in the open?", hi: "क्या आप खुले में शौच जाने के बजाय साफ शौचालय का उपयोग करते हैं?" },
  { en: "Do you avoid letting water stagnate around your home?", hi: "क्या आप अपने घर के आसपास पानी जमा होने से रोकते हैं?" },
  { en: "Do you bathe daily to keep your body clean?", hi: "क्या आप शरीर को साफ रखने के लिए रोज नहाते हैं?" },
  { en: "Do you wear fresh, washed clothes every day?", hi: "क्या आप रोज ताजे और धुले हुए कपड़े पहनते हैं?" }
];

const AWARENESS_DATA = {
  en: {
    readMore: "Read More",
    readLess: "Read Less",
    common_diseases: [
      {
        id: "dengue",
        title: "Dengue Fever",
        image: "https://image.pollinations.ai/prompt/Mosquito%20dengue%20fever%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=dengue+fever+health+tips+shorts",
        problem: "Dengue is a dangerous fever caused by mosquitoes that breed in clean, stagnant water.",
        symptomsLabel: "Symptoms",
        symptoms: [
          { text: "High fever", icon: "thermometer-outline" },
          { text: "Body ache", icon: "body-outline" },
        ],
        whatToDoLabel: "What to Do",
        whatToDo: [
          "Drink plenty of fluids",
          "Rest properly in mosquito net"
        ],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: [
          "Do not take painkillers blindly",
          "Do not let water stagnate"
        ],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["If bleeding occurs", "Continuous vomiting"],
        watchVideoLabel: "Watch Video",
      },
      {
        id: "malaria",
        title: "Malaria",
        image: "https://image.pollinations.ai/prompt/Mosquito%20bite%20malaria%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=malaria+health+tips+shorts",
        problem: "Malaria is a serious disease causing extreme cold chills and high fever due to mosquito bites.",
        symptomsLabel: "Symptoms",
        symptoms: [
          { text: "Chills", icon: "snow-outline" },
          { text: "High fever", icon: "thermometer-outline" },
        ],
        whatToDoLabel: "What to Do",
        whatToDo: [
          "Sleep inside mosquito nets",
          "Keep surroundings completely dry"
        ],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: [
          "Do not ignore recurring fever",
          "Do not sleep outdoors unprotected"
        ],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["Fever returns every 2 days", "Extreme shivering attacks"],
        watchVideoLabel: "Watch Video",
      },
      {
        id: "diarrhea",
        title: "Diarrhea",
        image: "https://image.pollinations.ai/prompt/Stomach%20ache%20diarrhea%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=diarrhea+health+tips+shorts",
        problem: "Diarrhea is passing loose stool frequently, leading to severe body water loss quickly.",
        symptomsLabel: "Symptoms",
        symptoms: [
          { text: "Watery stool", icon: "water-outline" },
          { text: "Weakness", icon: "battery-dead-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: [
          "Drink ORS solution constantly",
          "Boil water before drinking"
        ],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: [
          "Do not eat heavy outside food",
          "Do not stop drinking fluids"
        ],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["Lasts more than 2 days", "Blood in stool"],
        watchVideoLabel: "Watch Video",
      }
    ],
    mother_child: [
      {
        id: "preg_care",
        title: "Pregnancy Care",
        image: "https://image.pollinations.ai/prompt/Pregnant%20woman%20medical%20care%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=pregnancy+care+rural+health+shorts",
        problem: "A pregnant mother needs extra nutrition and regular checkups for a healthy baby.",
        symptomsLabel: "Warning Signs",
        symptoms: [
          { text: "Swelling", icon: "warning-outline" },
          { text: "Bleeding", icon: "water-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Take iron tablets", "Eat green leafy vegetables"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Avoid heavy lifting", "Never skip meals"],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["No baby movement", "Sharp abdomen pain"],
        watchVideoLabel: "Watch Video",
      },
      {
        id: "baby_care",
        title: "Newborn Baby Care",
        image: "https://image.pollinations.ai/prompt/Newborn%20baby%20health%20care%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=newborn+baby+care+tips+shorts",
        problem: "Newborns have weak immunity and require clean handling and exclusive breastfeeding safely.",
        symptomsLabel: "Warning Signs",
        symptoms: [
          { text: "Not feeding", icon: "restaurant-outline" },
          { text: "Fast breathing", icon: "pulse-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Exclusive breastfeed", "Wash hands prior"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["No water before 6 months", "No missing vaccines"],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["Baby turns blue", "Constant crying"],
        watchVideoLabel: "Watch Video",
      }
    ],
    nutrition: [
      {
        id: "healthy_food",
        title: "Daily Healthy Diet",
        image: "https://image.pollinations.ai/prompt/Healthy%20balanced%20diet%20plate%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=healthy+diet+tips+shorts",
        problem: "A balanced diet prevents diseases and ensures children grow properly and strongly.",
        symptomsLabel: "Signs of Weakness",
        symptoms: [
          { text: "Tiredness", icon: "battery-dead-outline" },
          { text: "Frequent illness", icon: "medical-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Eat seasonal fruits", "Include dal daily"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Stale exposed food", "Sugary snacks"],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["Sudden weight drop", "Extreme weakness"],
        watchVideoLabel: "Watch Video",
      },
      {
        id: "clean_water",
        title: "Clean Drinking Water",
        image: "https://image.pollinations.ai/prompt/Pouring%20clean%20drinking%20water%20into%20glass%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=clean+drinking+water+importance+shorts",
        problem: "Dirty water is the leading cause of cholera, typhoid, and dangerous stomach infections.",
        symptomsLabel: "Signs of Bad Water",
        symptoms: [
          { text: "Cloudy look", icon: "eye-off-outline" },
          { text: "Bad smell", icon: "nuclear-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Boil water for 5 mins", "Keep water covered"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Do not put dirty hands inside", "Avoid open ponds"],
        whenDoctorLabel: "When to Doctor",
        whenDoctor: ["If you develop typhoid fever", "Persistent stomach issues"],
        watchVideoLabel: "Watch Video",
      }
    ],
    hygiene_sanitation: [
      {
        id: "handwashing",
        title: "Proper Handwashing",
        image: "https://image.pollinations.ai/prompt/Washing%20hands%20with%20soap%20bubbles%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=how+to+wash+hands+health+shorts",
        problem: "Dirty hands transfer thousands of germs directly into your stomach causing diseases.",
        symptomsLabel: "Consequences",
        symptoms: [
          { text: "Stomach Ache", icon: "sad-outline" },
          { text: "Worms", icon: "bug-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Wash with soap for 20s", "Wash before eating"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Eating with dirty nails", "Using only water"],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["Persistent stomach pain", "Severe infection"],
        watchVideoLabel: "Watch Video",
      },
      {
        id: "clean_toilets",
        title: "Clean Toilets",
        image: "https://image.pollinations.ai/prompt/Clean%20white%20toilet%20hygiene%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=importance+of+clean+toilet+shorts",
        problem: "Open defecation and dirty toilets spread serious bacterial diseases rapidly in villages.",
        symptomsLabel: "Risks",
        symptoms: [
          { text: "Infections", icon: "bug-outline" },
          { text: "Foul smell", icon: "nuclear-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Always use a proper toilet", "Clean with phenyl"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Do not go in open fields", "Avoid wet dirty floors"],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["If you catch urinary infections", "Skin rashes"],
        watchVideoLabel: "Watch Video",
      }
    ],
    seasonal_diseases: [
      {
        id: "heatstroke",
        title: "Heatstroke",
        image: "https://image.pollinations.ai/prompt/Person%20sweating%20under%20hot%20sun%20heatstroke%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=heatstroke+prevention+shorts",
        problem: "Working in extreme heat without hydration causes heatstroke, leading to fainting quickly.",
        symptomsLabel: "Symptoms",
        symptoms: [
          { text: "Dizziness", icon: "medical-outline" },
          { text: "Fast heartbeat", icon: "pulse-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Drink lots of water", "Stay in shade"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Avoid direct extreme sun", "No midday farm work"],
        whenDoctorLabel: "When to Visit Doctor",
        whenDoctor: ["Person faints", "High body temp, no sweat"],
        watchVideoLabel: "Watch Video",
      },
      {
        id: "cold_flu",
        title: "Cold & Flu",
        image: "https://image.pollinations.ai/prompt/Person%20sneezing%20cold%20flu%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=common+cold+prevention+shorts",
        problem: "Seasonal changes often bring viral infections causing sore throat, runny nose, and tiredness.",
        symptomsLabel: "Symptoms",
        symptoms: [
          { text: "Runny nose", icon: "water-outline" },
          { text: "Coughing", icon: "alert-circle-outline" }
        ],
        whatToDoLabel: "What to Do",
        whatToDo: ["Drink warm water", "Cover mouth while coughing"],
        whatNotToDoLabel: "What Not to Do",
        whatNotToDo: ["Do not drink chilled water", "Avoid crowds"],
        whenDoctorLabel: "When to Doctor",
        whenDoctor: ["Fever over 102°F", "Difficulty breathing properly"],
        watchVideoLabel: "Watch Video",
      }
    ]
  },
  hi: {
    readMore: "और पढ़ें",
    readLess: "कम पढ़ें",
    common_diseases: [
      {
        id: "dengue",
        title: "डेंगू बुखार",
        image: "https://image.pollinations.ai/prompt/Mosquito%20dengue%20fever%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=dengue+fever+health+tips+hindi+shorts",
        problem: "डेंगू मच्छरों से फैलने वाला बुखार है। ये मच्छर साफ़ रुके हुए पानी में पनपते हैं।",
        symptomsLabel: "लक्षण",
        symptoms: [
          { text: "तेज बुखार", icon: "thermometer-outline" },
          { text: "बदन दर्द", icon: "body-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["खूब तरल पदार्थ पियें", "मच्छरदानी में आराम करें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["बिना पूछे दर्द की दवा न लें", "पानी जमा न होने दें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["खून आने पर", "लगातार उल्टी होने पर"],
        watchVideoLabel: "वीडियो देखें",
      },
      {
        id: "malaria",
        title: "मलेरिया",
        image: "https://image.pollinations.ai/prompt/Mosquito%20bite%20malaria%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=malaria+health+tips+hindi+shorts",
        problem: "मलेरिया मच्छरों के काटने से होता है जिससे बहुत तेज बुखार और ठंड लगती है।",
        symptomsLabel: "लक्षण",
        symptoms: [
          { text: "कंपकंपी (ठंड)", icon: "snow-outline" },
          { text: "तेज बुखार", icon: "thermometer-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["हमेशा मच्छरदानी लगाएं", "आसपास सूखा रखें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["बुखार को नजरअंदाज न करें", "खुले में न सोएं"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["हर 2 दिन में बुखार आना", "बहुत तेज ठंड लगना"],
        watchVideoLabel: "वीडियो देखें",
      },
      {
        id: "diarrhea",
        title: "डायरिया (दस्त)",
        image: "https://image.pollinations.ai/prompt/Stomach%20ache%20diarrhea%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=diarrhea+health+tips+hindi+shorts",
        problem: "डायरिया में बार-बार पतले दस्त आते हैं, जिससे शरीर में पानी की भारी कमी हो जाती है।",
        symptomsLabel: "लक्षण",
        symptoms: [
          { text: "पानी जैसे दस्त", icon: "water-outline" },
          { text: "कमजोरी", icon: "battery-dead-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["थोड़ी-थोड़ी देर में ORS पियें", "पानी उबाल कर पियें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["बाहर का खाना न खाएं", "पानी पीना बंद न करें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["दस्त 2 दिन से ज्यादा रहें", "शौच में खून आये"],
        watchVideoLabel: "वीडियो देखें",
      }
    ],
    mother_child: [
      {
        id: "preg_care",
        title: "गर्भावस्था की देखभाल",
        image: "https://image.pollinations.ai/prompt/Pregnant%20woman%20medical%20care%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=pregnancy+care+hindi+shorts",
        problem: "एक स्वस्थ बच्चे के लिए गर्भवती माँ को अतिरिक्त पोषण और नियमित जांच जरूरत होती है।",
        symptomsLabel: "खतरे के लक्षण",
        symptoms: [
          { text: "सूजन", icon: "warning-outline" },
          { text: "खून आना", icon: "water-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["आयरन की गोलियां लें", "हरी सब्जियां खाएं"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["भारी वजन न उठाएं", "उपवास न करें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["बच्चे का हिलना बंद हो", "तेज पेट दर्द"],
        watchVideoLabel: "वीडियो देखें",
      },
      {
        id: "baby_care",
        title: "नवजात की देखभाल",
        image: "https://image.pollinations.ai/prompt/Newborn%20baby%20health%20care%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=newborn+baby+care+hindi+shorts",
        problem: "नवजात शिशु बहुत नाजुक होते हैं, उन्हें केवल स्तनपान और साफ-सफाई की सख्त जरूरत है।",
        symptomsLabel: "खतरे के लक्षण",
        symptoms: [
          { text: "दूध न पीना", icon: "restaurant-outline" },
          { text: "तेज सांस", icon: "pulse-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["केवल माँ का दूध", "हाथ धोकर छुएं"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["पानी या शहद न दें", "टीकाकरण न छोड़ें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["बच्चा नीला पड़ जाए", "लगातार रोना"],
        watchVideoLabel: "वीडियो देखें",
      }
    ],
    nutrition: [
      {
        id: "healthy_food",
        title: "दैनिक आहार",
        image: "https://image.pollinations.ai/prompt/Healthy%20balanced%20diet%20plate%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=healthy+diet+rural+hindi+shorts",
        problem: "संतुलित आहार ताकत देता है, बीमारियों से बचाता है और बच्चों के सही विकास में मदद करता है।",
        symptomsLabel: "कमजोरी",
        symptoms: [
          { text: "थकान", icon: "battery-dead-outline" },
          { text: "बार-बार बीमार पड़ना", icon: "medical-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["मौसमी फल खाएं", "दाल जरूर खाएं"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["बासी खाना न खाएं", "ज्यादा मीठा छोड़ें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["वजन तेजी से कम हो", "बहुत ज्यादा कमजोरी"],
        watchVideoLabel: "वीडियो देखें",
      },
      {
        id: "clean_water",
        title: "साफ़ पेयजल",
        image: "https://image.pollinations.ai/prompt/Pouring%20clean%20drinking%20water%20into%20glass%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=clean+drinking+water+hindi+shorts",
        problem: "गंदा पानी हैजा, टाइफाइड और पेट के गंभीर संक्रमण का मुख्य कारण है।",
        symptomsLabel: "गंदे पानी के लक्षण",
        symptoms: [
          { text: "गंदला दिखना", icon: "eye-off-outline" },
          { text: "खराब बदबू", icon: "nuclear-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["पानी 5 मिनट उबालें", "पानी ढककर रखें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["पानी में गंदे हाथ न डालें", "तालाब का पानी न पियें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["टाइफाइड बुखार दिखे", "लगातार पेट खराब होना"],
        watchVideoLabel: "वीडियो देखें",
      }
    ],
    hygiene_sanitation: [
      {
        id: "handwashing",
        title: "हाथ धोना",
        image: "https://image.pollinations.ai/prompt/Washing%20hands%20with%20soap%20bubbles%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=how+to+wash+hands+hindi+shorts",
        problem: "गंदे हाथों से हजारों कीटाणु सीधे आपके पेट में जाते हैं जो बीमारियों का कारण बनते हैं।",
        symptomsLabel: "परिणाम",
        symptoms: [
          { text: "पेट दर्द", icon: "sad-outline" },
          { text: "पेट के कीड़े", icon: "bug-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["साबुन से हाथ धोएं", "खाने से पहले धोएं"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["गंदे नाखूनों से खाना", "केवल पानी से धोना"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["लगातार पेट दर्द होना", "गंभीर पेट संक्रमण"],
        watchVideoLabel: "वीडियो देखें",
      },
      {
        id: "clean_toilets",
        title: "साफ़ शौचालय",
        image: "https://image.pollinations.ai/prompt/Clean%20white%20toilet%20hygiene%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=importance+of+clean+toilet+hindi+shorts",
        problem: "खुले में शौच और गंदे शौचालय गांवों में गंभीर बैक्टीरिया फैलाते हैं।",
        symptomsLabel: "खतरे",
        symptoms: [
          { text: "संक्रमण", icon: "bug-outline" },
          { text: "गंदी बदबू", icon: "nuclear-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["हमेशा शौचालय उपयोग करें", "फिनाइल से साफ करें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["खुले खेतों में न जाएं", "फर्श गीला न छोड़ें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["पेशाब में रुकावट या दर्द", "त्वचा के दाने"],
        watchVideoLabel: "वीडियो देखें",
      }
    ],
    seasonal_diseases: [
      {
        id: "heatstroke",
        title: "लू (हीटस्ट्रोक)",
        image: "https://image.pollinations.ai/prompt/Person%20sweating%20under%20hot%20sun%20heatstroke%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=heatstroke+tips+hindi+shorts",
        problem: "तेज धूप और बिना पानी पिए बाहर काम करने से लू लगती है, जिससे व्यक्ति बेहोश हो जाता है।",
        symptomsLabel: "लक्षण",
        symptoms: [
          { text: "चक्कर आना", icon: "medical-outline" },
          { text: "तेज धड़कन", icon: "pulse-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["खूब पानी पियें", "छांव में रहें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["सीधी धूप से बचें", "खाली पेट बाहर न जाएं"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["व्यक्ति बेहोश हो जाए", "बिना पसीने के बुखार"],
        watchVideoLabel: "वीडियो देखें",
      },
      {
        id: "cold_flu",
        title: "सर्दी और जुकाम",
        image: "https://image.pollinations.ai/prompt/Person%20sneezing%20cold%20flu%20illustration?width=400&height=400&nologo=true",
        videoUrl: "https://www.youtube.com/results?search_query=common+cold+prevention+hindi+shorts",
        problem: "मौसम बदलने पर वायरल संक्रमण गले में खराश और नाक बहने का कारण बनता है।",
        symptomsLabel: "लक्षण",
        symptoms: [
          { text: "नाक बहना", icon: "water-outline" },
          { text: "खांसी", icon: "alert-circle-outline" }
        ],
        whatToDoLabel: "क्या करें",
        whatToDo: ["गर्म पानी पियें", "खांसते समय मुंह ढकें"],
        whatNotToDoLabel: "क्या न करें",
        whatNotToDo: ["ठंडा पानी न पियें", "भीड़ से बचें"],
        whenDoctorLabel: "डॉक्टर के पास",
        whenDoctor: ["102°F से अधिक बुखार", "सांस लेने में कठिनाई"],
        watchVideoLabel: "वीडियो देखें",
      }
    ]
  }
};

const SymptomBadge = ({ icon, text }) => (
  <View style={styles.symptomBadge}>
    <Ionicons name={icon} size={16} color="#065f46" />
    <Text style={styles.symptomText}>{text}</Text>
  </View>
);

const ChecklistItem = ({ icon, color, text }) => (
  <View style={styles.checklistItem}>
    <Ionicons name={icon} size={18} color={color} style={styles.checklistIcon} />
    <Text style={styles.checklistText}>{text}</Text>
  </View>
);

const DailyQuestion = ({ lang }) => {
  const [answered, setAnswered] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const content = DAILY_QUESTION_UI[lang];

  useFocusEffect(
    useCallback(() => {
      setAnswered(false);
      setQuestionIndex((prev) => {
        let next;
        do {
          next = Math.floor(Math.random() * QUESTIONS_LIST.length);
        } while (next === prev);
        return next;
      });
    }, [])
  );

  const currentQuestionText = QUESTIONS_LIST[questionIndex][lang];

  return (
    <View style={styles.dailyQuestionCard}>
      <View style={styles.dqHeader}>
        <Ionicons name="leaf" size={24} color="#059669" style={{ marginRight: 8 }} />
        <Text style={styles.dqTitle}>{content.title}</Text>
      </View>
      <Text style={styles.dqText}>{currentQuestionText}</Text>

      {answered ? (
        <View style={styles.dqThanksWrap}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <Text style={styles.dqThanksText}>{content.thanks}</Text>
        </View>
      ) : (
        <View style={styles.dqActions}>
          <TouchableOpacity style={styles.dqYesBtn} onPress={() => setAnswered(true)}>
            <Ionicons name="checkmark-circle" size={18} color="#065f46" />
            <Text style={styles.dqYesText}>{content.yes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dqNoBtn} onPress={() => setAnswered(true)}>
            <Ionicons name="close-circle" size={18} color="#991b1b" />
            <Text style={styles.dqNoText}>{content.no}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const SafeImage = ({ source, style, title }) => {
  const [error, setError] = useState(false);
  // Default health-related placeholder from local assets (not text)
  const fallback = fallbackImage;

  let imageSource = error || !source ? fallback : source;

  // Generic gray blurhash for a shimmer/skeleton loader effect
  const blurhash = 'LKN]Rv%2Tw=w]~RBVZRi};RPxuwH';

  return (
    <Image
      source={imageSource}
      style={[style, { backgroundColor: 'transparent' }]}
      contentFit="cover"
      placeholder={blurhash}
      transition={300}
      cachePolicy="disk" // Aggressive caching for rural/slow internet
      onError={(e) => {
        if (!error) setError(true);
      }}
    />
  );
};

const TopicCard = ({ topic, dataValues }) => {
  const [expanded, setExpanded] = useState(false);

  const handleOpenVideo = () => {
    Linking.openURL(topic.videoUrl).catch((err) => console.error("Couldn't open video", err));
  };

  return (
    <View style={styles.topicCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.topicTitle}>{topic.title}</Text>
          <Text style={styles.problemText}>{topic.problem}</Text>
        </View>
        <View style={styles.cardImageWrap}>
          <SafeImage source={imageConfig[topic.id]} title={topic.title} style={StyleSheet.absoluteFill} />
        </View>
      </View>

      <View style={styles.miniGrid}>
        <View style={styles.miniColumn}>
          <Text style={styles.miniTitle}><Ionicons name="leaf-outline" size={16} /> {topic.symptomsLabel}</Text>
          {topic.symptoms.map((s, idx) => (
            <SymptomBadge key={idx} icon={s.icon} text={s.text} />
          ))}
        </View>
        <View style={styles.miniColumn}>
          <Text style={[styles.miniTitle, { color: '#059669' }]}><Ionicons name="shield-checkmark" size={16} /> {topic.whatToDoLabel}</Text>
          {topic.whatToDo.map((item, idx) => (
            <ChecklistItem key={idx} icon="checkmark-circle" color="#059669" text={item} />
          ))}
        </View>
      </View>

      {expanded ? (
        <View style={styles.expandedContent}>
          <View style={styles.miniGrid}>
            <View style={styles.miniColumn}>
              <Text style={[styles.miniTitle, { color: '#dc2626' }]}><Ionicons name="warning" size={16} /> {topic.whatNotToDoLabel}</Text>
              {topic.whatNotToDo.map((item, idx) => (
                <ChecklistItem key={idx} icon="close-circle" color="#dc2626" text={item} />
              ))}
            </View>
            <View style={styles.miniColumn}>
              <Text style={[styles.miniTitle, { color: '#ea580c' }]}><Ionicons name="medkit" size={16} /> {topic.whenDoctorLabel}</Text>
              {topic.whenDoctor.map((item, idx) => (
                <ChecklistItem key={idx} icon="alert-circle" color="#ea580c" text={item} />
              ))}
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.watchVideoBtn} onPress={handleOpenVideo}>
          <Ionicons name="logo-youtube" size={18} color="#fff" />
          <Text style={styles.watchVideoText}>{topic.watchVideoLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.readMoreBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.readMoreText}>{expanded ? dataValues.readLess : dataValues.readMore}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#059669" />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const HealthAwarenessScreen = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';

  const [activeCategory, setActiveCategory] = useState('common_diseases');
  const content = AWARENESS_DATA[lang];
  const activeTopics = content[activeCategory] || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2fbf5" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <DailyQuestion lang={lang} />

        <View style={[styles.tabsContainer, { marginHorizontal: -16, marginBottom: 16 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.tabBtn, activeCategory === cat.id && styles.tabBtnActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.tabText, activeCategory === cat.id && styles.tabTextActive]}>
                  {lang === 'en' ? cat.labelEn : cat.labelHi}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {activeTopics.length === 0 ? (
          <Text style={styles.emptyText}>No content available for this category.</Text>
        ) : (
          activeTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} dataValues={content} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2fbf5', // Soft green tint background
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
    fontSize: 16
  },
  dailyQuestionCard: {
    backgroundColor: '#fffbeb', // soft yellow/warm color
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
    elevation: 2,
  },
  dqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dqTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065f46',
  },
  dqText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#451a03',
    marginBottom: 16,
  },
  dqActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dqYesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#86efac'
  },
  dqYesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065f46',
    marginLeft: 6
  },
  dqNoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  dqNoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991b1b',
    marginLeft: 6
  },
  dqThanksWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 12,
  },
  dqThanksText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065f46',
    marginLeft: 8,
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 8,
  },
  problemText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardImageWrap: {
    width: 110,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f2fbf5',
  },
  miniGrid: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  miniColumn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
  },
  symptomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 6,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checklistIcon: {
    marginTop: 0,
    marginRight: 6,
  },
  checklistText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
  },
  expandedContent: {
    paddingTop: 12,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  watchVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    gap: 6
  },
  watchVideoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 4
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  }
});

export default HealthAwarenessScreen;
