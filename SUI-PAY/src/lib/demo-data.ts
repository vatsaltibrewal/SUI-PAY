// Demo data creation for testing the integrated system
import { DataStore } from './storage';

export async function createDemoData() {
  // Only create demo data if no creators exist
  const existingCreators = await DataStore.findCreatorByUsername('demo');
  if (existingCreators) {
    console.log('Demo data already exists');
    return;
  }

  try {
    // Create a demo creator
    const demoCreator = await DataStore.createCreator({
      email: 'demo@suipay.com',
      username: 'demo',
      displayName: 'Demo Creator',
      bio: 'This is a demo creator account showcasing SuiPay features!',
      avatar: undefined,
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      suiNameService: '@demo.suins',
      isVerified: true,
      twitterHandle: '@democreator',
      websiteUrl: 'https://democreator.com',
      minDonationAmount: 1.0,
      customMessage: 'Thanks for supporting my work!'
    });

    // Create demo payments
    const demoPayments = [
      {
        txHash: '0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
        amount: 25.0,
        currency: 'SUI',
        message: 'Great work! Keep it up!',
        donorName: 'Alice',
        donorEmail: undefined,
        isAnonymous: false,
        fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        toAddress: demoCreator.walletAddress,
        blockHeight: 12345,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        creatorId: demoCreator.id
      },
      {
        txHash: '0xb2c3d4e5f6789012345678901234567890123456789012345678901234567890a1',
        amount: 10.0,
        currency: 'SUI',
        message: 'Love your content!',
        donorName: undefined,
        donorEmail: undefined,
        isAnonymous: true,
        fromAddress: '0x123abc4567890def1234567890abc123def45678',
        toAddress: demoCreator.walletAddress,
        blockHeight: 12346,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        creatorId: demoCreator.id
      },
      {
        txHash: '0xc3d4e5f6789012345678901234567890123456789012345678901234567890a1b2',
        amount: 50.0,
        currency: 'SUI',
        message: 'Amazing project!',
        donorName: 'Bob Smith',
        donorEmail: undefined,
        isAnonymous: false,
        fromAddress: '0x456def7890123abc4567890def123abc456def78',
        toAddress: demoCreator.walletAddress,
        blockHeight: 12347,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        creatorId: demoCreator.id
      },
      {
        txHash: '0xd4e5f6789012345678901234567890123456789012345678901234567890a1b2c3',
        amount: 15.0,
        currency: 'SUI',
        message: 'Thank you for sharing your knowledge!',
        donorName: 'Charlie',
        donorEmail: undefined,
        isAnonymous: false,
        fromAddress: '0x789abc0123def4567890abc123def456789abc01',
        toAddress: demoCreator.walletAddress,
        blockHeight: 12348,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        creatorId: demoCreator.id
      },
      {
        txHash: '0xe5f6789012345678901234567890123456789012345678901234567890a1b2c3d4',
        amount: 30.0,
        currency: 'SUI',
        message: '',
        donorName: 'Diana',
        donorEmail: undefined,
        isAnonymous: false,
        fromAddress: '0xabc012345def6789abc012345def6789abc01234',
        toAddress: demoCreator.walletAddress,
        blockHeight: 12349,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        creatorId: demoCreator.id
      }
    ];

    // Create the demo payments
    for (const payment of demoPayments) {
      await DataStore.createPayment(payment);
    }

    // Create a demo shareable link
    await DataStore.createLink({
      slug: 'demo-support',
      title: 'Support Demo Creator',
      description: 'Help support Demo Creator\'s amazing work!',
      isActive: true,
      buttonText: 'Support Me',
      theme: 'default',
      clickCount: 42,
      creatorId: demoCreator.id
    });

    console.log('Demo data created successfully!');
    console.log(`Created demo creator: ${demoCreator.username}`);
    console.log(`Created ${demoPayments.length} demo payments`);

    return demoCreator;
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
}

// Function to create demo data for a specific user
export async function createUserDemoData(userId: string, userWallet: string) {
  try {
    // Create a few demo payments for the user
    const demoPayments = [
      {
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        amount: 20.0,
        currency: 'SUI',
        message: 'Welcome to SuiPay!',
        donorName: 'Welcome Bot',
        donorEmail: undefined,
        isAnonymous: false,
        fromAddress: '0x0000000000000000000000000000000000000000',
        toAddress: userWallet,
        blockHeight: Math.floor(Math.random() * 100000),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        creatorId: userId
      }
    ];

    for (const payment of demoPayments) {
      await DataStore.createPayment(payment);
    }

    console.log(`Created welcome payment for user ${userId}`);
  } catch (error) {
    console.error('Error creating user demo data:', error);
  }
}
