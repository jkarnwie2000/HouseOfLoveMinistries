/**
 * ============================================================================
 *  EDITABLE SITE CONTENT
 *  Everything marked PLACEHOLDER must be confirmed or replaced by the ministry.
 *  No real names, addresses or history have been invented.
 * ============================================================================
 */

/**
 * SITE PHOTOGRAPHY
 * Add a photo to client/public/images and register it here, e.g.
 *   hero: '/images/hero-worship.jpg',
 *   'ministry-youth': '/images/ministry-youth.jpg',
 * Any key left out shows the designed placeholder instead (no broken images).
 * Keys: hero, welcome, about-history, give-hero, ministry-<id>, leader-<n>, outreach-<n>
 */
export const photos = {
  // hero: '/images/hero-worship.jpg',
};

export const church = {
  name: 'House of Love International Ministries',
  shortName: 'House of Love',
  tagline: 'Faith · Love · Community',
  description:
    'A Christian church family rooted in God’s Word, inspired by our African heritage and committed to sharing the love of Christ with every neighbour.',
  // PLACEHOLDER contact details – replace before launch
  email: 'info@example.org',
  phone: '(000) 000-0000',
  addressLines: ['Church address to be confirmed', 'City, State ZIP'],
  officeHours: 'Office hours to be confirmed',
  isPlaceholderContact: true,
};

// PLACEHOLDER social profile links – replace with the ministry’s real pages.
export const socialLinks = [
  { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/' },
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/' },
  { id: 'whatsapp', label: 'WhatsApp', url: 'https://www.whatsapp.com/' },
];

// PLACEHOLDER service times
export const serviceSchedule = [
  { day: 'Sunday', name: 'Worship Service', time: '10:00 AM' },
  { day: 'Wednesday', name: 'Bible Study', time: '7:00 PM' },
  { day: 'Friday', name: 'Prayer Meeting', time: '6:30 PM' },
];

export const mission =
  'To glorify God by proclaiming the Gospel of Jesus Christ, making disciples, and demonstrating His love through worship, fellowship and compassionate service to our community and the nations.';
export const vision =
  'To be a house of love where every person – of every nation and background – encounters Christ, grows in faith, discovers their purpose and is sent out to serve.';

export const coreValues = [
  { icon: 'Heart', title: 'Love', text: 'We love God wholeheartedly and love our neighbours as ourselves (Mark 12:30–31).' },
  { icon: 'BookOpen', title: 'The Word', text: 'Scripture is our foundation and guide for faith and everyday life.' },
  { icon: 'Flame', title: 'Prayer & Worship', text: 'We seek God’s presence through heartfelt prayer and Spirit-led worship.' },
  { icon: 'Users', title: 'Unity & Family', text: 'We are one family in Christ, celebrating our heritage and welcoming all nations.' },
  { icon: 'HandHeart', title: 'Service', text: 'We follow Jesus by serving others with humility, generosity and compassion.' },
  { icon: 'ShieldCheck', title: 'Integrity', text: 'We steward every gift, relationship and resource faithfully and transparently.' },
];

// Statement of faith – PLACEHOLDER: please review against the ministry’s official doctrine.
export const beliefs = [
  { title: 'The Bible', text: 'We believe the Bible is the inspired, infallible Word of God and the final authority for faith and life.' },
  { title: 'The Trinity', text: 'We believe in one God, eternally existing in three persons: Father, Son and Holy Spirit.' },
  { title: 'Jesus Christ', text: 'We believe in the deity of Jesus Christ, His virgin birth, sinless life, atoning death, bodily resurrection and promised return.' },
  { title: 'Salvation', text: 'We believe salvation is by grace through faith in Jesus Christ alone, and that all who believe receive new life.' },
  { title: 'The Holy Spirit', text: 'We believe the Holy Spirit indwells, empowers and guides believers to live godly lives and serve others.' },
  { title: 'The Church', text: 'We believe the Church is the body of Christ, called to worship, fellowship, discipleship and mission.' },
];

// PLACEHOLDER history milestones – the ministry should replace these with its real story.
export const history = [
  { label: 'Our beginning', text: '[Placeholder] Tell the story of how House of Love International Ministries was founded – who, when and where.' },
  { label: 'Growing together', text: '[Placeholder] Describe how the church family grew, key moments and answered prayers.' },
  { label: 'Reaching out', text: '[Placeholder] Share how the ministry began serving the wider community and the nations.' },
  { label: 'Today', text: '[Placeholder] Describe the church today – its people, ministries and vision for the future.' },
];

// PLACEHOLDER leadership – names and photos intentionally left blank.
export const leadership = [
  { id: 1, name: 'Name to be confirmed', role: 'Senior Pastor', bio: 'Leadership biography will be added by the ministry.' },
  { id: 2, name: 'Name to be confirmed', role: 'Associate Pastor', bio: 'Leadership biography will be added by the ministry.' },
  { id: 3, name: 'Name to be confirmed', role: 'Worship Leader', bio: 'Leadership biography will be added by the ministry.' },
  { id: 4, name: 'Name to be confirmed', role: 'Outreach Coordinator', bio: 'Leadership biography will be added by the ministry.' },
];

export const ministries = [
  {
    id: 'worship-prayer', name: 'Worship & Prayer', icon: 'Music', tone: 'wine',
    summary: 'Spirit-filled praise, intercession and encounters with God’s presence.',
    description: 'Our worship and prayer ministry leads the church into the presence of God through vibrant praise – often blending gospel, contemporary and African worship traditions – and faithful intercession for our families, city and the nations.',
    activities: ['Sunday praise & worship team', 'Friday prayer meeting', 'Choir and instrumental training', 'Prayer chain for urgent requests'],
    meets: 'Sundays & Fridays (times to be confirmed)',
  },
  {
    id: 'youth', name: 'Youth Ministry', icon: 'Sparkles', tone: 'gold',
    summary: 'Equipping the next generation to know Christ and lead with purpose.',
    description: 'A safe, energetic community where teenagers and young adults grow in faith, build lifelong friendships, and discover their God-given gifts through teaching, mentorship, worship and service.',
    activities: ['Youth fellowship nights', 'Mentorship & leadership training', 'Retreats and camps', 'Career and life-skills workshops'],
    meets: 'Schedule to be confirmed',
  },
  {
    id: 'womens', name: 'Women’s Ministry', icon: 'Flower2', tone: 'wine',
    summary: 'Women growing together in faith, friendship and purpose.',
    description: 'Through Bible study, prayer, mentoring and fellowship, women of every season of life are encouraged to grow in Christ and support one another.',
    activities: ['Women’s Bible study', 'Prayer breakfasts', 'Mentoring circles', 'Annual women’s conference'],
    meets: 'Schedule to be confirmed',
  },
  {
    id: 'mens', name: 'Men’s Ministry', icon: 'Shield', tone: 'charcoal',
    summary: 'Building men of faith, integrity and servant leadership.',
    description: 'Men are encouraged to grow as disciples, husbands, fathers and leaders through honest fellowship, accountability, Bible study and service.',
    activities: ['Men’s fellowship breakfast', 'Accountability groups', 'Service projects', 'Fathers’ mentoring'],
    meets: 'Schedule to be confirmed',
  },
  {
    id: 'children', name: 'Children’s Ministry', icon: 'Baby', tone: 'gold',
    summary: 'Helping children discover God’s love in a safe, joyful place.',
    description: 'Age-appropriate Bible lessons, songs, crafts and games help children learn about Jesus while parents worship. All volunteers follow child-safety guidelines (policy to be confirmed by the ministry).',
    activities: ['Sunday children’s church', 'Vacation Bible school', 'Children’s choir', 'Family dedication services'],
    meets: 'Sundays during worship',
  },
  {
    id: 'outreach', name: 'Community Outreach', icon: 'HandHeart', tone: 'forest',
    summary: 'Sharing Christ’s love through practical care for our neighbours.',
    description: 'We serve our community through food and clothing drives, visits to the sick and elderly, support for newcomers and families in need, and partnerships with local organisations.',
    activities: ['Food & clothing drives', 'Hospital and home visits', 'Newcomer & immigrant support', 'Holiday care packages'],
    meets: 'Monthly outreach days (dates on the Events page)',
  },
  {
    id: 'missions', name: 'Evangelism & Missions', icon: 'Globe2', tone: 'charcoal',
    summary: 'Taking the Gospel to our city, to Africa and to the nations.',
    description: 'We share the good news of Jesus locally and internationally through evangelism, mission trips and support for partner ministries.',
    activities: ['Street & community evangelism', 'Short-term mission trips', 'Supporting missionaries', 'Church-planting partnerships'],
    meets: 'Schedule to be confirmed',
  },
  {
    id: 'discipleship', name: 'Bible Study & Discipleship', icon: 'BookOpen', tone: 'forest',
    summary: 'Growing deep roots in God’s Word together.',
    description: 'Through midweek Bible study, discipleship classes and small groups, believers grow in understanding of Scripture and in Christ-like character.',
    activities: ['Midweek Bible study', 'New believers’ class', 'Small groups', 'Baptism & membership classes'],
    meets: 'Wednesdays (time to be confirmed)',
  },
];

export const outreachHighlights = [
  { id: 1, icon: 'ShoppingBasket', title: 'Feeding Families', text: 'Food and clothing drives that meet practical needs with dignity and prayer.' },
  { id: 2, icon: 'HeartPulse', title: 'Caring for the Vulnerable', text: 'Visiting the sick, the elderly and the lonely with the comfort of Christ.' },
  { id: 3, icon: 'Globe2', title: 'Reaching the Nations', text: 'Supporting mission work in our city, across Africa and around the world.' },
];

export const givingImpact = [
  { icon: 'Church', title: 'Church operations', text: 'Keeping our doors open for worship, prayer and fellowship.' },
  { icon: 'HandHeart', title: 'Community outreach', text: 'Food, clothing and care for neighbours in need.' },
  { icon: 'Globe2', title: 'Evangelism & missions', text: 'Sharing the Gospel locally and among the nations.' },
  { icon: 'Sparkles', title: 'Youth development', text: 'Mentoring and equipping the next generation.' },
  { icon: 'Users', title: 'Family support programmes', text: 'Strengthening marriages, parents and children.' },
  { icon: 'Gift', title: 'Charitable activities', text: 'Practical help for those facing hardship.' },
  { icon: 'Building2', title: 'Ministry expansion', text: 'Growing our reach, facilities and ministries.' },
];

// EDITABLE nonprofit disclosure (shown on the Give page and donation receipts).
export const donationDisclosure =
  'House of Love International Ministries gratefully receives all gifts. Gifts are used at the discretion of the ministry to further its mission. ' +
  'We do not provide tax advice: whether your gift is tax-deductible depends on the ministry’s legal status and your personal circumstances. ' +
  'Please contact the church office and consult your tax adviser regarding the tax treatment of your donation.';
