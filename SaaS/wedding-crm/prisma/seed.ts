import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

const adapter = new PrismaLibSql({ url: `file:${process.cwd()}/dev.db` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.vendorFollowUp.deleteMany()
  await prisma.vendorAssignment.deleteMany()
  await prisma.checklistItem.deleteMany()
  await prisma.checklist.deleteMany()
  await prisma.sOPTemplateItem.deleteMany()
  await prisma.sOPTemplate.deleteMany()
  await prisma.functionTask.deleteMany()
  await prisma.weddingFunction.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.note.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.clientPortalAccess.deleteMany()
  await prisma.dataLibraryItem.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.wedding.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.user.deleteMany()

  // ==================== USERS ====================
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'admin@wedcrm.com', password: hashedPassword, role: 'ADMIN', phone: '+91 98765 43210' },
  })

  const rm1 = await prisma.user.create({
    data: { name: 'Anjali Mehta', email: 'anjali@wedcrm.com', password: hashedPassword, role: 'RELATIONSHIP_MANAGER', phone: '+91 98765 43211' },
  })

  const rm2 = await prisma.user.create({
    data: { name: 'Rohit Kapoor', email: 'rohit@wedcrm.com', password: hashedPassword, role: 'RELATIONSHIP_MANAGER', phone: '+91 98765 43212' },
  })

  const vc = await prisma.user.create({
    data: { name: 'Meera Patel', email: 'meera@wedcrm.com', password: hashedPassword, role: 'VENDOR_COORDINATOR', phone: '+91 98765 43213' },
  })

  console.log('Users created')

  // ==================== LEADS ====================
  const leads = await Promise.all([
    prisma.lead.create({ data: { name: 'Aisha Khan', email: 'aisha@gmail.com', phone: '+91 99887 76655', source: 'Instagram', status: 'NEW', budget: 2500000, weddingDate: new Date('2026-11-15'), venue: 'The Oberoi, Udaipur', guestCount: 350, priority: 'HIGH', requirements: 'Destination wedding in Rajasthan, royal theme', assignedToId: rm1.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Vikram Reddy', email: 'vikram.r@gmail.com', phone: '+91 98776 54321', source: 'Referral', status: 'CONTACTED', budget: 5000000, weddingDate: new Date('2026-10-20'), venue: 'ITC Grand Bharat', guestCount: 500, priority: 'URGENT', requirements: 'Grand wedding with 3-day celebration', assignedToId: rm1.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Neha Gupta', email: 'neha.g@outlook.com', phone: '+91 87654 32109', source: 'Website', status: 'QUALIFIED', budget: 1500000, weddingDate: new Date('2026-09-08'), venue: 'Jaypee Palace, Agra', guestCount: 200, priority: 'MEDIUM', requirements: 'Intimate wedding with modern decor', assignedToId: rm2.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Arjun Singh', email: 'arjun.s@yahoo.com', phone: '+91 76543 21098', source: 'Wedding Fair', status: 'PROPOSAL_SENT', budget: 3500000, weddingDate: new Date('2026-12-01'), venue: 'Taj Falaknuma, Hyderabad', guestCount: 400, priority: 'HIGH', requirements: 'South Indian + North Indian fusion wedding', assignedToId: rm2.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Riya Joshi', email: 'riya.j@gmail.com', phone: '+91 65432 10987', source: 'Google', status: 'NEGOTIATION', budget: 4000000, weddingDate: new Date('2026-08-15'), venue: 'Leela Palace, Bangalore', guestCount: 300, priority: 'HIGH', requirements: 'Eco-friendly wedding with sustainable decor', assignedToId: rm1.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Kabir Malhotra', email: 'kabir.m@gmail.com', phone: '+91 54321 09876', source: 'Instagram', status: 'WON', budget: 6000000, weddingDate: new Date('2026-07-20'), venue: 'Umaid Bhawan, Jodhpur', guestCount: 600, priority: 'URGENT', assignedToId: rm1.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Tanya Batra', email: 'tanya.b@gmail.com', phone: '+91 43210 98765', source: 'Facebook', status: 'LOST', budget: 800000, priority: 'LOW', lostReason: 'Budget constraints', createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Dev Chauhan', email: 'dev.c@gmail.com', phone: '+91 32109 87654', source: 'Walk-in', status: 'NEW', budget: 2000000, weddingDate: new Date('2027-01-10'), priority: 'MEDIUM', requirements: 'Beach wedding in Goa', createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Simran Kaur', email: 'simran.k@gmail.com', phone: '+91 21098 76543', source: 'Referral', status: 'CONTACTED', budget: 3000000, weddingDate: new Date('2026-11-25'), venue: 'The Leela, Delhi', guestCount: 450, priority: 'HIGH', assignedToId: rm2.id, createdById: admin.id } }),
    prisma.lead.create({ data: { name: 'Manish Agarwal', email: 'manish.a@gmail.com', phone: '+91 10987 65432', source: 'Google', status: 'QUALIFIED', budget: 1800000, weddingDate: new Date('2026-10-05'), guestCount: 250, priority: 'MEDIUM', assignedToId: rm1.id, createdById: admin.id } }),
  ])

  console.log('Leads created:', leads.length)

  // ==================== VENDORS ====================
  const vendors = await Promise.all([
    prisma.vendor.create({ data: { name: 'Dhawal Mehta Photography', category: 'PHOTOGRAPHER', email: 'dhawal@photos.com', phone: '+91 98765 11111', city: 'Mumbai', rating: 4.8, priceRange: 'PREMIUM', website: 'dhawalphoto.com', instagram: '@dhawalmehta' } }),
    prisma.vendor.create({ data: { name: 'Royal Caterers', category: 'CATERER', email: 'info@royalcaterers.com', phone: '+91 98765 22222', city: 'Delhi', rating: 4.5, priceRange: 'PREMIUM', notes: 'Specializes in North Indian and Mughlai cuisine' } }),
    prisma.vendor.create({ data: { name: 'Ferns N Petals Decor', category: 'DECORATOR', email: 'events@fnp.com', phone: '+91 98765 33333', city: 'Delhi', rating: 4.6, priceRange: 'LUXURY', website: 'fnp.com' } }),
    prisma.vendor.create({ data: { name: 'DJ Aqeel', category: 'DJ', email: 'dj@aqeel.com', phone: '+91 98765 44444', city: 'Mumbai', rating: 4.9, priceRange: 'LUXURY' } }),
    prisma.vendor.create({ data: { name: 'Ambika Makeup Studio', category: 'MAKEUP_ARTIST', email: 'ambika@makeup.com', phone: '+91 98765 55555', city: 'Jaipur', rating: 4.7, priceRange: 'PREMIUM', instagram: '@ambikamakeup' } }),
    prisma.vendor.create({ data: { name: 'Raju Mehendi Artist', category: 'MEHENDI_ARTIST', phone: '+91 98765 66666', city: 'Udaipur', rating: 4.4, priceRange: 'MODERATE' } }),
    prisma.vendor.create({ data: { name: 'The Grand Palace', category: 'VENUE', email: 'events@grandpalace.com', phone: '+91 98765 77777', city: 'Delhi', rating: 4.3, priceRange: 'LUXURY', website: 'thegrandpalace.in' } }),
    prisma.vendor.create({ data: { name: 'Flower Power', category: 'FLORIST', email: 'bloom@flowerpower.in', phone: '+91 98765 88888', city: 'Bangalore', rating: 4.2, priceRange: 'MODERATE' } }),
    prisma.vendor.create({ data: { name: 'WedFilms Studio', category: 'VIDEOGRAPHER', email: 'hello@wedfilms.com', phone: '+91 98765 99999', city: 'Mumbai', rating: 4.6, priceRange: 'PREMIUM', instagram: '@wedfilms' } }),
    prisma.vendor.create({ data: { name: 'Pandit Shivkumar', category: 'PANDIT', phone: '+91 98765 00001', city: 'Varanasi', rating: 4.8, priceRange: 'MODERATE' } }),
    prisma.vendor.create({ data: { name: 'Royal Transport Services', category: 'TRANSPORT', email: 'royal@transport.in', phone: '+91 98765 00002', city: 'Delhi', rating: 4.1, priceRange: 'PREMIUM' } }),
    prisma.vendor.create({ data: { name: 'Nachle Choreography', category: 'CHOREOGRAPHER', email: 'nachle@dance.com', phone: '+91 98765 00003', city: 'Mumbai', rating: 4.5, priceRange: 'MODERATE', instagram: '@nachlechoreo' } }),
  ])

  console.log('Vendors created:', vendors.length)

  // ==================== WEDDINGS ====================
  const wedding1 = await prisma.wedding.create({
    data: {
      clientName: 'Kabir Malhotra',
      partnerName: 'Preetika Sharma',
      weddingDate: new Date('2026-07-20'),
      venue: 'Umaid Bhawan, Jodhpur',
      city: 'Jodhpur',
      budget: 6000000,
      guestCount: 600,
      status: 'IN_PROGRESS',
      theme: 'Royal Rajasthani',
      leadId: leads[5].id,
      assignedRMId: rm1.id,
    },
  })

  const wedding2 = await prisma.wedding.create({
    data: {
      clientName: 'Nita & Ravi Deshmukh',
      partnerName: 'Ravi Deshmukh',
      weddingDate: new Date('2026-09-15'),
      venue: 'Taj Lake Palace, Udaipur',
      city: 'Udaipur',
      budget: 4500000,
      guestCount: 350,
      status: 'PLANNING',
      theme: 'Lake Palace Romance',
      assignedRMId: rm2.id,
    },
  })

  const wedding3 = await prisma.wedding.create({
    data: {
      clientName: 'Sanya Kapoor',
      partnerName: 'Aditya Verma',
      weddingDate: new Date('2026-12-10'),
      venue: 'ITC Maurya, Delhi',
      city: 'Delhi',
      budget: 3500000,
      guestCount: 400,
      status: 'PLANNING',
      theme: 'Modern Minimalist',
      assignedRMId: rm1.id,
    },
  })

  console.log('Weddings created: 3')

  // ==================== WEDDING FUNCTIONS ====================
  const fn1 = await prisma.weddingFunction.create({ data: { weddingId: wedding1.id, name: 'Mehendi', date: new Date('2026-07-18'), venue: 'Umaid Bhawan Garden', status: 'CONFIRMED', budget: 500000, guestCount: 200 } })
  const fn2 = await prisma.weddingFunction.create({ data: { weddingId: wedding1.id, name: 'Sangeet', date: new Date('2026-07-19'), venue: 'Umaid Bhawan Ballroom', status: 'CONFIRMED', budget: 800000, guestCount: 400 } })
  const fn3 = await prisma.weddingFunction.create({ data: { weddingId: wedding1.id, name: 'Wedding Ceremony', date: new Date('2026-07-20'), venue: 'Umaid Bhawan Main Hall', status: 'PLANNING', budget: 1500000, guestCount: 600 } })
  const fn4 = await prisma.weddingFunction.create({ data: { weddingId: wedding1.id, name: 'Reception', date: new Date('2026-07-20'), venue: 'Umaid Bhawan Grand Lawn', status: 'PLANNING', budget: 1200000, guestCount: 600 } })

  await prisma.weddingFunction.create({ data: { weddingId: wedding2.id, name: 'Haldi', date: new Date('2026-09-13'), venue: 'Taj Lake Palace Terrace', status: 'PLANNING', budget: 200000, guestCount: 100 } })
  await prisma.weddingFunction.create({ data: { weddingId: wedding2.id, name: 'Sangeet', date: new Date('2026-09-14'), venue: 'Taj Lake Palace Hall', status: 'PLANNING', budget: 500000, guestCount: 300 } })
  await prisma.weddingFunction.create({ data: { weddingId: wedding2.id, name: 'Wedding Ceremony', date: new Date('2026-09-15'), venue: 'Taj Lake Palace', status: 'PLANNING', budget: 1000000, guestCount: 350 } })

  console.log('Wedding functions created')

  // ==================== FUNCTION TASKS ====================
  await prisma.functionTask.createMany({
    data: [
      { functionId: fn1.id, title: 'Book mehendi artist', status: 'COMPLETED', priority: 'HIGH' },
      { functionId: fn1.id, title: 'Arrange seating cushions', status: 'COMPLETED', priority: 'MEDIUM' },
      { functionId: fn1.id, title: 'Order fresh flowers', status: 'IN_PROGRESS', priority: 'HIGH' },
      { functionId: fn2.id, title: 'Hire choreographer', status: 'COMPLETED', priority: 'HIGH' },
      { functionId: fn2.id, title: 'Book DJ', status: 'COMPLETED', priority: 'HIGH' },
      { functionId: fn2.id, title: 'Set up sound system', status: 'PENDING', priority: 'MEDIUM' },
      { functionId: fn2.id, title: 'Lighting decor for stage', status: 'IN_PROGRESS', priority: 'HIGH' },
      { functionId: fn3.id, title: 'Book pandit', status: 'COMPLETED', priority: 'URGENT' },
      { functionId: fn3.id, title: 'Mandap decoration', status: 'PENDING', priority: 'HIGH' },
      { functionId: fn3.id, title: 'Arrange baraat procession', status: 'PENDING', priority: 'HIGH' },
      { functionId: fn4.id, title: 'Finalize menu with caterer', status: 'IN_PROGRESS', priority: 'HIGH' },
      { functionId: fn4.id, title: 'Stage setup for performances', status: 'PENDING', priority: 'MEDIUM' },
    ],
  })

  console.log('Function tasks created')

  // ==================== VENDOR ASSIGNMENTS ====================
  await prisma.vendorAssignment.createMany({
    data: [
      { vendorId: vendors[0].id, weddingId: wedding1.id, status: 'CONFIRMED', agreedPrice: 200000 },
      { vendorId: vendors[1].id, weddingId: wedding1.id, functionId: fn4.id, status: 'CONFIRMED', agreedPrice: 800000 },
      { vendorId: vendors[2].id, weddingId: wedding1.id, status: 'CONFIRMED', agreedPrice: 500000 },
      { vendorId: vendors[3].id, weddingId: wedding1.id, functionId: fn2.id, status: 'CONFIRMED', agreedPrice: 150000 },
      { vendorId: vendors[4].id, weddingId: wedding1.id, status: 'CONFIRMED', agreedPrice: 100000 },
      { vendorId: vendors[5].id, weddingId: wedding1.id, functionId: fn1.id, status: 'CONFIRMED', agreedPrice: 50000 },
      { vendorId: vendors[8].id, weddingId: wedding1.id, status: 'PROPOSED', agreedPrice: 250000 },
      { vendorId: vendors[9].id, weddingId: wedding1.id, functionId: fn3.id, status: 'CONFIRMED', agreedPrice: 25000 },
      { vendorId: vendors[0].id, weddingId: wedding2.id, status: 'PROPOSED', agreedPrice: 180000 },
      { vendorId: vendors[2].id, weddingId: wedding2.id, status: 'PROPOSED', agreedPrice: 400000 },
    ],
  })

  console.log('Vendor assignments created')

  // ==================== VENDOR FOLLOW-UPS ====================
  await prisma.vendorFollowUp.createMany({
    data: [
      { vendorId: vendors[0].id, type: 'CALL', notes: 'Discuss album package options', followUpDate: new Date('2026-04-01') },
      { vendorId: vendors[1].id, type: 'EMAIL', notes: 'Send updated menu for tasting', followUpDate: new Date('2026-03-25'), isCompleted: true, completedAt: new Date() },
      { vendorId: vendors[2].id, type: 'MEETING', notes: 'Venue visit for decor measurement', followUpDate: new Date('2026-04-05') },
      { vendorId: vendors[8].id, type: 'WHATSAPP', notes: 'Share wedding film samples', followUpDate: new Date('2026-03-28') },
    ],
  })

  console.log('Vendor follow-ups created')

  // ==================== SOP TEMPLATES ====================
  const sopPreWedding = await prisma.sOPTemplate.create({
    data: {
      name: 'Pre-Wedding Planning SOP',
      description: 'Complete pre-wedding checklist from 6 months to 1 week before',
      category: 'PRE_WEDDING',
      items: {
        create: [
          { title: 'Finalize wedding date and venue', orderIndex: 0, daysOffset: -180, isMandatory: true },
          { title: 'Set wedding budget', orderIndex: 1, daysOffset: -170, isMandatory: true },
          { title: 'Create guest list', orderIndex: 2, daysOffset: -150, isMandatory: true },
          { title: 'Book photographer and videographer', orderIndex: 3, daysOffset: -120, isMandatory: true },
          { title: 'Book caterer and finalize menu', orderIndex: 4, daysOffset: -90, isMandatory: true },
          { title: 'Book decorator', orderIndex: 5, daysOffset: -90 },
          { title: 'Send wedding invitations', orderIndex: 6, daysOffset: -60, isMandatory: true },
          { title: 'Book mehendi and makeup artists', orderIndex: 7, daysOffset: -60 },
          { title: 'Arrange transportation', orderIndex: 8, daysOffset: -45 },
          { title: 'First dress fitting', orderIndex: 9, daysOffset: -45 },
          { title: 'Finalize sangeet performances', orderIndex: 10, daysOffset: -30 },
          { title: 'Confirm all vendor bookings', orderIndex: 11, daysOffset: -14, isMandatory: true },
          { title: 'Final venue walkthrough', orderIndex: 12, daysOffset: -7, isMandatory: true },
          { title: 'Distribute event timeline to all vendors', orderIndex: 13, daysOffset: -3, isMandatory: true },
        ],
      },
    },
  })

  const sopWeddingDay = await prisma.sOPTemplate.create({
    data: {
      name: 'Wedding Day Execution SOP',
      description: 'Hour-by-hour checklist for the wedding day',
      category: 'WEDDING_DAY',
      items: {
        create: [
          { title: 'Venue setup check (6 AM)', orderIndex: 0, daysOffset: 0, isMandatory: true },
          { title: 'Vendor arrival verification', orderIndex: 1, daysOffset: 0, isMandatory: true },
          { title: 'Bride makeup starts', orderIndex: 2, daysOffset: 0 },
          { title: 'Groom styling starts', orderIndex: 3, daysOffset: 0 },
          { title: 'Catering setup verification', orderIndex: 4, daysOffset: 0, isMandatory: true },
          { title: 'Sound and lighting check', orderIndex: 5, daysOffset: 0 },
          { title: 'Welcome desk and guest management', orderIndex: 6, daysOffset: 0, isMandatory: true },
          { title: 'Baraat coordination', orderIndex: 7, daysOffset: 0 },
          { title: 'Ceremony flow management', orderIndex: 8, daysOffset: 0, isMandatory: true },
          { title: 'Reception coordination', orderIndex: 9, daysOffset: 0 },
          { title: 'Vidaai arrangements', orderIndex: 10, daysOffset: 0 },
          { title: 'Post-event cleanup coordination', orderIndex: 11, daysOffset: 0 },
        ],
      },
    },
  })

  const sopVendor = await prisma.sOPTemplate.create({
    data: {
      name: 'Vendor Management SOP',
      description: 'Standard vendor coordination checklist',
      category: 'VENDOR_MGMT',
      items: {
        create: [
          { title: 'Collect vendor portfolio and references', orderIndex: 0, isMandatory: true },
          { title: 'Negotiate pricing and packages', orderIndex: 1, isMandatory: true },
          { title: 'Sign contract and collect advance', orderIndex: 2, isMandatory: true },
          { title: 'Share event brief and timeline', orderIndex: 3, isMandatory: true },
          { title: 'Schedule pre-event meeting', orderIndex: 4 },
          { title: 'Confirm attendance 48 hours before', orderIndex: 5, isMandatory: true },
          { title: 'Share venue access details', orderIndex: 6 },
          { title: 'Collect deliverables post-event', orderIndex: 7, isMandatory: true },
          { title: 'Process final payment', orderIndex: 8, isMandatory: true },
          { title: 'Collect feedback and update rating', orderIndex: 9 },
        ],
      },
    },
  })

  console.log('SOP templates created: 3')

  // ==================== APPLIED CHECKLISTS ====================
  const checklist1 = await prisma.checklist.create({
    data: {
      name: 'Pre-Wedding Planning - Kabir & Preetika',
      weddingId: wedding1.id,
      templateId: sopPreWedding.id,
      items: {
        create: [
          { title: 'Finalize wedding date and venue', orderIndex: 0, isMandatory: true, isCompleted: true, completedAt: new Date() },
          { title: 'Set wedding budget', orderIndex: 1, isMandatory: true, isCompleted: true, completedAt: new Date() },
          { title: 'Create guest list', orderIndex: 2, isMandatory: true, isCompleted: true, completedAt: new Date() },
          { title: 'Book photographer and videographer', orderIndex: 3, isMandatory: true, isCompleted: true, completedAt: new Date() },
          { title: 'Book caterer and finalize menu', orderIndex: 4, isMandatory: true, isCompleted: true, completedAt: new Date() },
          { title: 'Book decorator', orderIndex: 5, isCompleted: true, completedAt: new Date() },
          { title: 'Send wedding invitations', orderIndex: 6, isMandatory: true, isCompleted: false },
          { title: 'Book mehendi and makeup artists', orderIndex: 7, isCompleted: true, completedAt: new Date() },
          { title: 'Arrange transportation', orderIndex: 8, isCompleted: false },
          { title: 'First dress fitting', orderIndex: 9, isCompleted: false },
          { title: 'Finalize sangeet performances', orderIndex: 10, isCompleted: false },
          { title: 'Confirm all vendor bookings', orderIndex: 11, isMandatory: true, isCompleted: false },
          { title: 'Final venue walkthrough', orderIndex: 12, isMandatory: true, isCompleted: false },
          { title: 'Distribute event timeline to all vendors', orderIndex: 13, isMandatory: true, isCompleted: false },
        ],
      },
    },
  })

  console.log('Applied checklists created')

  // ==================== PAYMENTS ====================
  await prisma.payment.createMany({
    data: [
      { weddingId: wedding1.id, amount: 1500000, type: 'ADVANCE', status: 'RECEIVED', paidDate: new Date('2026-02-15'), notes: 'Initial booking advance' },
      { weddingId: wedding1.id, amount: 2000000, type: 'MILESTONE', status: 'RECEIVED', paidDate: new Date('2026-04-01'), notes: 'Second milestone payment' },
      { weddingId: wedding1.id, amount: 1500000, type: 'MILESTONE', status: 'PENDING', dueDate: new Date('2026-06-15'), notes: 'Third milestone payment' },
      { weddingId: wedding1.id, amount: 1000000, type: 'FINAL', status: 'PENDING', dueDate: new Date('2026-07-25'), notes: 'Final settlement' },
      { weddingId: wedding2.id, amount: 1000000, type: 'ADVANCE', status: 'RECEIVED', paidDate: new Date('2026-03-01'), notes: 'Booking advance' },
      { weddingId: wedding2.id, amount: 1500000, type: 'MILESTONE', status: 'PENDING', dueDate: new Date('2026-07-01'), notes: 'First milestone' },
    ],
  })

  console.log('Payments created')

  // ==================== DATA LIBRARY ====================
  await prisma.dataLibraryItem.createMany({
    data: [
      { title: 'Top 50 Wedding Venues in Rajasthan', content: 'Comprehensive guide to the best wedding venues in Rajasthan including Umaid Bhawan, City Palace, Jai Mahal Palace, Samode Palace, and more. Includes capacity, pricing range, and amenities for each venue.', category: 'VENUE_INFO', tags: 'rajasthan,venue,destination,palace', isPublic: true },
      { title: 'Wedding Photography Pricing Guide 2026', content: 'Standard pricing tiers for wedding photography in India:\n\nBudget: ₹50,000 - ₹1,50,000 (1 photographer, basic editing)\nModerate: ₹1,50,000 - ₹3,00,000 (2 photographers, album included)\nPremium: ₹3,00,000 - ₹6,00,000 (team, drone, pre-wedding shoot)\nLuxury: ₹6,00,000+ (celebrity photographers, international)', category: 'PRICING_GUIDE', tags: 'photography,pricing,2026' },
      { title: 'Indian Wedding Planning Timeline', content: 'Month-by-month breakdown of tasks:\n\n12 months: Set budget, book venue\n9 months: Book photographer, caterer\n6 months: Send save-the-dates, book decorators\n3 months: Send invitations, finalize menu\n1 month: Final fittings, confirm vendors\n1 week: Final walkthrough, pack essentials', category: 'CHECKLIST_TEMPLATE', tags: 'timeline,planning,checklist', isPublic: true },
      { title: 'Wedding Decor Trends 2026', content: 'Top decor trends this season:\n1. Sustainable & eco-friendly decor\n2. Pastel and earthy color palettes\n3. Maximalist floral installations\n4. LED and fairy light ceilings\n5. Vintage photo corners\n6. Interactive food stations\n7. Personalized neon signs', category: 'TREND', tags: 'decor,trends,2026', isPublic: true },
      { title: 'Standard Wedding Contract Template', content: 'Key clauses to include in wedding planning contracts:\n1. Scope of services\n2. Payment terms and schedule\n3. Cancellation policy\n4. Force majeure clause\n5. Liability limitations\n6. Vendor substitution policy\n7. Intellectual property rights\n8. Dispute resolution mechanism', category: 'CONTRACT_TEMPLATE', tags: 'contract,legal,template' },
      { title: 'Vendor Negotiation Tips', content: 'Best practices for vendor negotiations:\n- Always get 3 quotes minimum\n- Ask for package customization\n- Negotiate on deliverables, not just price\n- Get everything in writing\n- Ask about off-season discounts\n- Bundle services for better rates', category: 'VENDOR_GUIDE', tags: 'vendor,negotiation,tips' },
      { title: 'FAQ - Destination Wedding Planning', content: 'Common questions from clients about destination weddings:\n\nQ: How far in advance should we book?\nA: 12-18 months minimum\n\nQ: What about guest accommodation?\nA: Block rooms at 2-3 price points\n\nQ: How to handle local vendors vs bringing our own?\nA: Use local for catering/decor, bring your own photographer', category: 'FAQ', tags: 'destination,faq,planning', isPublic: true },
    ],
  })

  console.log('Data library items created')

  // ==================== ACTIVITIES ====================
  await prisma.activity.createMany({
    data: [
      { type: 'STATUS_CHANGE', title: 'Lead status changed to WON', description: 'Kabir Malhotra confirmed the booking', leadId: leads[5].id, userId: admin.id },
      { type: 'MEETING', title: 'Initial meeting with Kabir & Preetika', description: 'Discussed wedding theme, venue preferences, and budget', weddingId: wedding1.id, userId: rm1.id },
      { type: 'CALL', title: 'Venue confirmation call', description: 'Confirmed Umaid Bhawan booking for July 18-20', weddingId: wedding1.id, userId: rm1.id },
      { type: 'EMAIL', title: 'Sent vendor proposals', description: 'Shared photographer and decorator proposals with client', weddingId: wedding1.id, userId: vc.id },
      { type: 'NOTE', title: 'Client preference update', description: 'Preetika prefers pastel pink and gold color scheme for all functions', weddingId: wedding1.id, userId: rm1.id },
      { type: 'FOLLOW_UP', title: 'Follow-up with Vikram Reddy', description: 'Called to discuss budget requirements and venue options', leadId: leads[1].id, userId: rm1.id },
    ],
  })

  console.log('Activities created')

  // ==================== CLIENT PORTAL ACCESS ====================
  await prisma.clientPortalAccess.create({
    data: {
      weddingId: wedding1.id,
      userId: admin.id,
      accessToken: 'demo-portal-token-kabir',
      permissions: 'VIEW_TIMELINE,VIEW_CHECKLIST,VIEW_VENDORS,VIEW_PAYMENTS',
      lastAccessed: new Date(),
    },
  })

  console.log('Client portal access created')
  console.log('\n✅ Seed completed successfully!')
  console.log('\nDemo credentials:')
  console.log('  Admin: admin@wedcrm.com / admin123')
  console.log('  RM 1: anjali@wedcrm.com / admin123')
  console.log('  RM 2: rohit@wedcrm.com / admin123')
  console.log('  VC: meera@wedcrm.com / admin123')
  console.log('\nClient Portal Demo: /client/demo-portal-token-kabir')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
