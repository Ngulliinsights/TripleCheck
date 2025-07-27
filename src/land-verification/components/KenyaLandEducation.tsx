import React, { useState } from 'react';
import { Book, AlertTriangle, CheckCircle, FileText, Users, Scale, MapPin, Shield, Gavel, Home } from 'lucide-react';

interface EducationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface KenyaLandEducationProps {
  focusArea?: 'overview' | 'tenure' | 'documents' | 'challenges' | 'process' | 'rights';
}

const EDUCATION_SECTIONS: EducationSection[] = [
  {
    id: 'overview',
    title: 'Kenya Land System Overview',
    icon: <Home className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Understanding Kenya's Land System</h3>
          <p className="text-blue-800 mb-3">
            Kenya's land system has evolved significantly since independence, with major reforms in 2010 
            creating a more structured approach to land ownership and management.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Key Institutions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ministry of Lands and Physical Planning</li>
                <li>• National Land Commission (NLC)</li>
                <li>• Land Registries (County level)</li>
                <li>• Environment and Land Court</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Legal Framework</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Constitution of Kenya 2010</li>
                <li>• Land Act 2012</li>
                <li>• Land Registration Act 2012</li>
                <li>• National Land Commission Act 2012</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Why Land Verification Matters</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-green-900 mb-1">Protect Investment</h4>
              <p className="text-sm text-green-800">Avoid financial loss from fraudulent transactions</p>
            </div>
            <div>
              <h4 className="font-medium text-green-900 mb-1">Legal Security</h4>
              <p className="text-sm text-green-800">Ensure clear and defensible ownership rights</p>
            </div>
            <div>
              <h4 className="font-medium text-green-900 mb-1">Peace of Mind</h4>
              <p className="text-sm text-green-800">Confidence in your property investment</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'tenure',
    title: 'Land Tenure Types',
    icon: <FileText className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-3">Three Main Tenure Types in Kenya</h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-2">1. Freehold Tenure</h4>
              <p className="text-yellow-800 mb-2">Absolute ownership with perpetual rights</p>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>Owner has complete control over the land</li>
                <li>Can be sold, leased, or inherited without restrictions</li>
                <li>Most secure form of land ownership</li>
                <li>Common in urban areas and former settler areas</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-2">2. Leasehold Tenure</h4>
              <p className="text-yellow-800 mb-2">Temporary ownership for a specified period (usually 99 years)</p>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>Granted by government or private landowners</li>
                <li>Subject to terms and conditions of the lease</li>
                <li>Can be renewed upon expiry</li>
                <li>Common for government and trust lands</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <h4 className="font-semibold text-yellow-900 mb-2">3. Customary Tenure</h4>
              <p className="text-yellow-800 mb-2">Traditional community-based ownership systems</p>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>Governed by traditional customs and practices</li>
                <li>Often communal rather than individual ownership</li>
                <li>Being formalized through community land registration</li>
                <li>Common in rural and pastoral areas</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">Tenure Conversion Risks</h3>
          <p className="text-red-800 mb-2">Be aware of properties undergoing tenure conversion:</p>
          <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
            <li>Incomplete conversion processes may affect ownership validity</li>
            <li>Community resistance to individual titling</li>
            <li>Overlapping claims during conversion periods</li>
            <li>Administrative delays and bureaucratic challenges</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'documents',
    title: 'Essential Land Documents',
    icon: <FileText className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Key Documents for Land Transactions</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-1">Title Deed</h4>
                <p className="text-sm text-purple-800 mb-2">Primary ownership document</p>
                <ul className="text-xs text-purple-700 list-disc list-inside">
                  <li>Shows current owner details</li>
                  <li>Property description and size</li>
                  <li>Tenure type and conditions</li>
                  <li>Registered charges or caveats</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-1">Survey Plan</h4>
                <p className="text-sm text-purple-800 mb-2">Technical boundary description</p>
                <ul className="text-xs text-purple-700 list-disc list-inside">
                  <li>Precise measurements and coordinates</li>
                  <li>Boundary markers and features</li>
                  <li>Surveyor's certification</li>
                  <li>Adjacent property references</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-1">Search Certificate</h4>
                <p className="text-sm text-purple-800 mb-2">Registry verification document</p>
                <ul className="text-xs text-purple-700 list-disc list-inside">
                  <li>Current ownership status</li>
                  <li>Registered transactions</li>
                  <li>Charges and encumbrances</li>
                  <li>Valid for 3 months</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-1">Consent to Transfer</h4>
                <p className="text-sm text-purple-800 mb-2">Government approval for transactions</p>
                <ul className="text-xs text-purple-700 list-disc list-inside">
                  <li>Required for agricultural land</li>
                  <li>Ensures compliance with land laws</li>
                  <li>Prevents unauthorized transfers</li>
                  <li>Valid for specific time period</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-1">Valuation Report</h4>
                <p className="text-sm text-purple-800 mb-2">Professional property assessment</p>
                <ul className="text-xs text-purple-700 list-disc list-inside">
                  <li>Current market value</li>
                  <li>Property condition assessment</li>
                  <li>Comparable sales analysis</li>
                  <li>Development potential</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-purple-300">
                <h4 className="font-semibold text-purple-900 mb-1">Environmental Impact Assessment</h4>
                <p className="text-sm text-purple-800 mb-2">Environmental compliance certificate</p>
                <ul className="text-xs text-purple-700 list-disc list-inside">
                  <li>Required for developments</li>
                  <li>Environmental impact evaluation</li>
                  <li>Mitigation measures</li>
                  <li>NEMA approval</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-900 mb-2">Document Verification Checklist</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-orange-900 mb-2">Authenticity Checks</h4>
              <ul className="text-sm text-orange-800 list-disc list-inside space-y-1">
                <li>Official stamps and seals</li>
                <li>Consistent signatures</li>
                <li>Quality of paper and printing</li>
                <li>Sequential numbering</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-900 mb-2">Content Verification</h4>
              <ul className="text-sm text-orange-800 list-disc list-inside space-y-1">
                <li>Matching property descriptions</li>
                <li>Consistent measurements</li>
                <li>Current owner details</li>
                <li>Valid dates and periods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'challenges',
    title: 'Common Land Ownership Challenges',
    icon: <AlertTriangle className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Major Land Ownership Risks in Kenya</h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-red-300">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Land Grabbing
              </h4>
              <p className="text-red-800 mb-2">Illegal acquisition through forged or fraudulent documents</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Warning Signs</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Suspiciously low prices</li>
                    <li>Pressure for quick transactions</li>
                    <li>Reluctance to provide documents</li>
                    <li>Multiple sellers for same property</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Protection Measures</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Verify all documents thoroughly</li>
                    <li>Conduct physical site visits</li>
                    <li>Check with local authorities</li>
                    <li>Use qualified professionals</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-red-300">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Double Allocation
              </h4>
              <p className="text-red-800 mb-2">Same land allocated to multiple parties by authorities</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Common Causes</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Poor record keeping</li>
                    <li>Corruption in allocation</li>
                    <li>Overlapping jurisdictions</li>
                    <li>System errors</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Prevention Steps</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Search multiple registries</li>
                    <li>Check with county authorities</li>
                    <li>Verify with neighbors</li>
                    <li>Review historical records</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-red-300">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <Gavel className="h-5 w-5 mr-2" />
                Succession Disputes
              </h4>
              <p className="text-red-800 mb-2">Family inheritance conflicts affecting property ownership</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Risk Factors</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Incomplete succession process</li>
                    <li>Multiple family claimants</li>
                    <li>Disputed wills</li>
                    <li>Customary vs. formal law conflicts</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Due Diligence</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Verify succession certificate</li>
                    <li>Check for family objections</li>
                    <li>Review court records</li>
                    <li>Consult with family members</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-red-300">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Government Acquisition
              </h4>
              <p className="text-red-800 mb-2">Uncompensated public use claims and designations</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Common Designations</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Road reserves and expansions</li>
                    <li>Riparian and water reserves</li>
                    <li>Utility corridors</li>
                    <li>Environmental conservation</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-red-900 mb-1">Verification Steps</h5>
                  <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Check development plans</li>
                    <li>Verify with relevant authorities</li>
                    <li>Review environmental assessments</li>
                    <li>Consult infrastructure plans</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'process',
    title: 'Multi-Layered Verification Process',
    icon: <CheckCircle className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-3">Six-Layer Verification Approach</h3>
          <p className="text-green-800 mb-4">
            Our comprehensive verification system uses multiple layers to ensure thorough property assessment
          </p>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</div>
                <h4 className="font-semibold text-green-900">Land Registry Integration</h4>
              </div>
              <p className="text-green-800 mb-2">Official government record verification</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Ministry of Lands database search</li>
                <li>Ownership history analysis</li>
                <li>Legal instrument verification</li>
                <li>Charge and caveat identification</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</div>
                <h4 className="font-semibold text-green-900">Physical Verification</h4>
              </div>
              <p className="text-green-800 mb-2">Ground-truthing of property boundaries</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>GPS coordinate validation</li>
                <li>Boundary marker verification</li>
                <li>Survey measurement validation</li>
                <li>Physical feature comparison</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</div>
                <h4 className="font-semibold text-green-900">Community Intelligence</h4>
              </div>
              <p className="text-green-800 mb-2">Local knowledge gathering</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Local administrator interviews</li>
                <li>Community member consultations</li>
                <li>Historical knowledge gathering</li>
                <li>Dispute identification</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">4</div>
                <h4 className="font-semibold text-green-900">Government Designation Assessment</h4>
              </div>
              <p className="text-green-800 mb-2">Hidden government claims identification</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Riparian reserve checking</li>
                <li>Road reserve verification</li>
                <li>Utility corridor assessment</li>
                <li>Environmental designation review</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">5</div>
                <h4 className="font-semibold text-green-900">Legal History Investigation</h4>
              </div>
              <p className="text-green-800 mb-2">Court records and dispute analysis</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Court case searches</li>
                <li>Dispute pattern analysis</li>
                <li>Legal risk assessment</li>
                <li>Resolution status verification</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-300">
              <div className="flex items-center mb-2">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">6</div>
                <h4 className="font-semibold text-green-900">Expert Coordination</h4>
              </div>
              <p className="text-green-800 mb-2">Professional surveyor and legal counsel integration</p>
              <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                <li>Qualified surveyor selection</li>
                <li>Legal counsel coordination</li>
                <li>Expert report integration</li>
                <li>Professional recommendation synthesis</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Process Timeline</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Phase 1: Initial (1-2 days)</h4>
              <p className="text-sm text-blue-800">Document upload and basic verification</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Phase 2: Investigation (3-7 days)</h4>
              <p className="text-sm text-blue-800">Registry, physical, and community verification</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Phase 3: Analysis (1-3 days)</h4>
              <p className="text-sm text-blue-800">Risk assessment and expert coordination</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'rights',
    title: 'Your Rights and Protections',
    icon: <Scale className="h-6 w-6" />,
    content: (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-semibold text-indigo-900 mb-3">Legal Rights and Protections</h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-300">
              <h4 className="font-semibold text-indigo-900 mb-2">Constitutional Rights</h4>
              <ul className="text-sm text-indigo-800 list-disc list-inside space-y-1">
                <li>Right to acquire and own property</li>
                <li>Protection against arbitrary deprivation</li>
                <li>Fair compensation for compulsory acquisition</li>
                <li>Equal access to land ownership</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-indigo-300">
              <h4 className="font-semibold text-indigo-900 mb-2">Legal Remedies</h4>
              <ul className="text-sm text-indigo-800 list-disc list-inside space-y-1">
                <li>Environment and Land Court jurisdiction</li>
                <li>Alternative dispute resolution mechanisms</li>
                <li>Compensation for wrongful acquisition</li>
                <li>Injunctive relief for threatened rights</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-indigo-300">
              <h4 className="font-semibold text-indigo-900 mb-2">Professional Support</h4>
              <ul className="text-sm text-indigo-800 list-disc list-inside space-y-1">
                <li>Qualified surveyors and valuers</li>
                <li>Licensed advocates and legal counsel</li>
                <li>Registered land agents</li>
                <li>Professional indemnity insurance</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-indigo-300">
              <h4 className="font-semibold text-indigo-900 mb-2">Regulatory Oversight</h4>
              <ul className="text-sm text-indigo-800 list-disc list-inside space-y-1">
                <li>National Land Commission oversight</li>
                <li>Professional body regulations</li>
                <li>Anti-corruption measures</li>
                <li>Public participation requirements</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">When to Seek Help</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Legal Assistance</h4>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>Complex ownership disputes</li>
                <li>Government acquisition issues</li>
                <li>Contract interpretation</li>
                <li>Court proceedings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Technical Support</h4>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>Boundary survey requirements</li>
                <li>Valuation and assessment</li>
                <li>Environmental compliance</li>
                <li>Development approvals</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export const KenyaLandEducation: React.FC<KenyaLandEducationProps> = ({ focusArea = 'overview' }) => {
  const [activeSection, setActiveSection] = useState(focusArea);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = EDUCATION_SECTIONS.filter(section =>
    searchTerm === '' || 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.id === searchTerm.toLowerCase()
  );

  const currentSection = filteredSections.find(section => section.id === activeSection) || 
                         EDUCATION_SECTIONS.find(section => section.id === activeSection);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kenya Land Ownership Education</h1>
        <p className="text-gray-600">
          Comprehensive guide to understanding Kenya's land system and protecting your property investments
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search education topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4">Topics</h2>
            <nav className="space-y-2">
              {filteredSections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${activeSection === section.id ? 'text-blue-600' : 'text-gray-400'}`}>
                      {section.icon}
                    </div>
                    <span className="text-sm font-medium">{section.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {currentSection && filteredSections.length > 0 ? (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="text-blue-600">
                    {currentSection.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentSection.title}</h2>
                </div>
                <div className="prose max-w-none">
                  {currentSection.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
                <p className="text-gray-600">Try adjusting your search terms or select a topic from the sidebar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KenyaLandEducation;