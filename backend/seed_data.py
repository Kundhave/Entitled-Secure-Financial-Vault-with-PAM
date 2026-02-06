"""
Seed script to populate database with initial data:
- Users (employees, admins, auditor) with encrypted TOTP secrets
- Vault items with encrypted financial records
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, VaultItem, VaultRecord, RoleEnum
from security import hash_password, encrypt_data, generate_totp_secret, encrypt_totp_secret
import uuid
import json


def seed_database():
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seeding...")
        
        # ==================== CREATE USERS ====================
        print("\n👥 Creating users...")
        
        users_data = [
            # Employees
            {"username": "employee1", "password": "employee123", "role": RoleEnum.EMPLOYEE},
            {"username": "employee2", "password": "employee123", "role": RoleEnum.EMPLOYEE},
            {"username": "employee3", "password": "employee123", "role": RoleEnum.EMPLOYEE},
            # Admins
            {"username": "admin1", "password": "admin123", "role": RoleEnum.ADMIN},
            {"username": "admin2", "password": "admin123", "role": RoleEnum.ADMIN},
            {"username": "admin3", "password": "admin123", "role": RoleEnum.ADMIN},
            # Auditor
            {"username": "auditor", "password": "auditor123", "role": RoleEnum.AUDITOR},
        ]
        
        created_users = {}
        for user_data in users_data:
            # Generate and encrypt TOTP secret
            totp_secret = generate_totp_secret()
            encrypted_totp = encrypt_totp_secret(totp_secret)
            
            user = User(
                id=uuid.uuid4(),
                username=user_data["username"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                totp_secret=encrypted_totp
            )
            db.add(user)
            created_users[user_data["username"]] = user
            print(f"   ✓ Created {user_data['role'].value}: {user_data['username']}")
        
        db.commit()
        
        # ==================== CREATE VAULT ITEMS WITH RECORDS ====================
        print("\n🔐 Creating vault items with encrypted financial records...")
        
        vault_items_data = [
            {
                "title": "Q4 2024 Venture Capital Portfolio",
                "records": [
                    {
                        "investment_name": "TechStartup AI Solutions Inc.",
                        "invested_amount": 2500000.00,
                        "investment_date": "2024-10-15",
                        "instrument_type": "Series A Preferred Stock",
                        "remarks": "Lead investor, board seat secured"
                    },
                    {
                        "investment_name": "GreenEnergy Innovations Ltd.",
                        "invested_amount": 1800000.00,
                        "investment_date": "2024-11-03",
                        "instrument_type": "Convertible Note",
                        "remarks": "Follow-on investment, 20% discount on conversion"
                    },
                    {
                        "investment_name": "HealthTech Diagnostics Corp.",
                        "invested_amount": 3200000.00,
                        "investment_date": "2024-10-22",
                        "instrument_type": "Series B Preferred Stock",
                        "remarks": "Co-investment with ABC Ventures"
                    },
                    {
                        "investment_name": "FinanceFlow SaaS Platform",
                        "invested_amount": 1500000.00,
                        "investment_date": "2024-11-18",
                        "instrument_type": "SAFE Agreement",
                        "remarks": "Valuation cap: $15M, 15% discount"
                    },
                    {
                        "investment_name": "CloudSecure Infrastructure",
                        "invested_amount": 2000000.00,
                        "investment_date": "2024-12-05",
                        "instrument_type": "Series A Preferred Stock",
                        "remarks": "Strategic investment, integration opportunities"
                    }
                ]
            },
            {
                "title": "Private Equity - Manufacturing Sector",
                "records": [
                    {
                        "investment_name": "Precision Engineering Holdings",
                        "invested_amount": 15000000.00,
                        "investment_date": "2024-09-10",
                        "instrument_type": "Common Equity",
                        "remarks": "40% ownership stake, operational control"
                    },
                    {
                        "investment_name": "Advanced Materials Corp.",
                        "invested_amount": 12500000.00,
                        "investment_date": "2024-10-01",
                        "instrument_type": "Mezzanine Debt",
                        "remarks": "12% annual interest, equity kicker of 10%"
                    },
                    {
                        "investment_name": "AutoParts Supply Chain Ltd.",
                        "invested_amount": 8000000.00,
                        "investment_date": "2024-11-12",
                        "instrument_type": "Preferred Equity",
                        "remarks": "8% cumulative dividend, liquidation preference"
                    },
                    {
                        "investment_name": "Sustainable Packaging Solutions",
                        "invested_amount": 10000000.00,
                        "investment_date": "2024-10-28",
                        "instrument_type": "Common Equity",
                        "remarks": "35% stake, two board seats"
                    },
                    {
                        "investment_name": "Industrial Robotics Systems",
                        "invested_amount": 18000000.00,
                        "investment_date": "2024-12-15",
                        "instrument_type": "Preferred Equity",
                        "remarks": "Co-investment, technology licensing rights"
                    },
                    {
                        "investment_name": "Precision Aerospace Components",
                        "invested_amount": 22000000.00,
                        "investment_date": "2024-11-20",
                        "instrument_type": "Common Equity",
                        "remarks": "Majority stake acquisition, management retention plan"
                    }
                ]
            },
            {
                "title": "Real Estate Investment Portfolio",
                "records": [
                    {
                        "investment_name": "Downtown Commercial Tower - NYC",
                        "invested_amount": 45000000.00,
                        "investment_date": "2024-08-15",
                        "instrument_type": "Direct Property Ownership",
                        "remarks": "Prime location, 95% occupancy, long-term leases"
                    },
                    {
                        "investment_name": "Luxury Residential Complex - Miami",
                        "invested_amount": 32000000.00,
                        "investment_date": "2024-09-22",
                        "instrument_type": "Joint Venture",
                        "remarks": "60% ownership, developer partnership"
                    },
                    {
                        "investment_name": "Industrial Warehouse - Dallas",
                        "invested_amount": 18000000.00,
                        "investment_date": "2024-10-05",
                        "instrument_type": "REIT Units",
                        "remarks": "E-commerce logistics hub, strong rental demand"
                    },
                    {
                        "investment_name": "Shopping Center - Los Angeles",
                        "invested_amount": 28000000.00,
                        "investment_date": "2024-11-08",
                        "instrument_type": "Direct Property Ownership",
                        "remarks": "Anchor tenant secured, value-add opportunity"
                    },
                    {
                        "investment_name": "Office Park - Austin",
                        "invested_amount": 25000000.00,
                        "investment_date": "2024-12-01",
                        "instrument_type": "Preferred Equity",
                        "remarks": "Tech corridor location, flexible workspace conversion planned"
                    }
                ]
            },
            {
                "title": "Hedge Fund Strategies - 2024",
                "records": [
                    {
                        "investment_name": "Long/Short Equity Fund Alpha",
                        "invested_amount": 50000000.00,
                        "investment_date": "2024-01-15",
                        "instrument_type": "Limited Partnership Interest",
                        "remarks": "2/20 fee structure, monthly redemptions"
                    },
                    {
                        "investment_name": "Global Macro Strategy Fund",
                        "invested_amount": 35000000.00,
                        "investment_date": "2024-03-10",
                        "instrument_type": "Limited Partnership Interest",
                        "remarks": "Multi-asset class, currency focus, quarterly liquidity"
                    },
                    {
                        "investment_name": "Event-Driven Opportunities",
                        "invested_amount": 40000000.00,
                        "investment_date": "2024-05-20",
                        "instrument_type": "Managed Account",
                        "remarks": "M&A arbitrage, restructuring plays"
                    },
                    {
                        "investment_name": "Quantitative Trading Fund",
                        "invested_amount": 60000000.00,
                        "investment_date": "2024-07-12",
                        "instrument_type": "Limited Partnership Interest",
                        "remarks": "AI-driven strategies, high-frequency component"
                    },
                    {
                        "investment_name": "Credit Opportunities Fund",
                        "invested_amount": 45000000.00,
                        "investment_date": "2024-09-18",
                        "instrument_type": "Separate Managed Account",
                        "remarks": "Distressed debt focus, special situations"
                    },
                    {
                        "investment_name": "Emerging Markets Fund",
                        "invested_amount": 30000000.00,
                        "investment_date": "2024-11-25",
                        "instrument_type": "Limited Partnership Interest",
                        "remarks": "Focus on Asia-Pacific and Latin America"
                    }
                ]
            },
            {
                "title": "Fixed Income & Structured Products",
                "records": [
                    {
                        "investment_name": "US Treasury 10-Year Notes",
                        "invested_amount": 100000000.00,
                        "investment_date": "2024-02-01",
                        "instrument_type": "Government Bonds",
                        "remarks": "Benchmark allocation, 4.25% yield"
                    },
                    {
                        "investment_name": "Investment Grade Corporate Bonds",
                        "invested_amount": 75000000.00,
                        "investment_date": "2024-03-15",
                        "instrument_type": "Corporate Bonds",
                        "remarks": "Diversified across sectors, average rating A-"
                    },
                    {
                        "investment_name": "Municipal Bonds - California",
                        "invested_amount": 50000000.00,
                        "investment_date": "2024-04-22",
                        "instrument_type": "Municipal Bonds",
                        "remarks": "Tax-exempt, infrastructure projects, AA rating"
                    },
                    {
                        "investment_name": "Collateralized Loan Obligations",
                        "invested_amount": 40000000.00,
                        "investment_date": "2024-06-10",
                        "instrument_type": "Structured Credit",
                        "remarks": "Senior tranches, floating rate exposure"
                    },
                    {
                        "investment_name": "High Yield Bond Portfolio",
                        "invested_amount": 35000000.00,
                        "investment_date": "2024-08-05",
                        "instrument_type": "Corporate Bonds",
                        "remarks": "Selective credits, average yield 7.5%"
                    },
                    {
                        "investment_name": "Mortgage-Backed Securities",
                        "invested_amount": 55000000.00,
                        "investment_date": "2024-10-18",
                        "instrument_type": "Agency MBS",
                        "remarks": "Fannie Mae and Freddie Mac, prepayment protected"
                    }
                ]
            }
        ]
        
        for vault_data in vault_items_data:
            # Create vault item
            vault_item = VaultItem(
                id=uuid.uuid4(),
                title=vault_data["title"]
            )
            db.add(vault_item)
            print(f"\n   📁 Vault: {vault_data['title']}")
            
            # Create encrypted records for this vault item
            for record_data in vault_data["records"]:
                # Encrypt the record data as JSON
                json_data = json.dumps(record_data)
                encrypted_payload = encrypt_data(json_data)
                
                record = VaultRecord(
                    id=uuid.uuid4(),
                    vault_item_id=vault_item.id,
                    encrypted_payload=encrypted_payload
                )
                db.add(record)
                print(f"      ✓ Record: {record_data['investment_name']} (${record_data['invested_amount']:,.2f})")
        
        db.commit()
        
        print("\n✅ Database seeding completed successfully!")
        print("\n" + "="*60)
        print("📋 CREDENTIALS FOR TESTING:")
        print("="*60)
        print("\nEMPLOYEES (password: employee123):")
        print("  - employee1")
        print("  - employee2")
        print("  - employee3")
        print("\nADMINS (password: admin123):")
        print("  - admin1")
        print("  - admin2")
        print("  - admin3")
        print("\nAUDITOR (password: auditor123):")
        print("  - auditor")
        print("\n" + "="*60)
        print("⚠️  IMPORTANT: Each user must scan their QR code for MFA setup!")
        print("   Login to get QR code at: /api/auth/qr-code")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
