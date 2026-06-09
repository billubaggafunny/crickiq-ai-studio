import CrickIQCard from './CrickIQCard';
import React, { useEffect, useState, useRef } from 'react';
import { SettingsIcon, LogoutIcon, SparklesIcon, HardDriveIcon, TrophyIcon } from '../constants';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

type DrawerPage = 'profile' | 'workspace' | 'upgrade' | 'backup' | 'settings' | 'help' | 'privacy' | 'logout' | null;

const WorkspaceSubPagePlaceholder: React.FC<{ subPage: string, title: string }> = ({ subPage, title }) => {
    const renderContent = () => {
        if (subPage === 'storage') {
            return (
                <div className="space-y-4">
                    <CrickIQCard  className="flex flex-col items-center justify-center text-center">
                        <HardDriveIcon className="w-12 h-12 text-danger mb-4" />
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Storage Usage</h3>
                        <p className="text-text-secondary mt-1">Placeholder for storage calculations</p>
                    </CrickIQCard>

                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary border-b border-brand-blue/15 pb-2 mb-2">Clear Data</h4>
                        <button className="w-full text-left font-semibold text-text-primary p-4 rounded-lg bg-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                            <span>Clear Quick Match History</span>
                            <span className="text-xs px-2 py-1 bg-danger/20 dark:bg-red-900/30 text-danger rounded-2xl font-bold">Clear</span>
                        </button>
                        <button className="w-full text-left font-semibold text-text-primary p-4 rounded-lg bg-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                            <span>Clear Tournament History</span>
                            <span className="text-xs px-2 py-1 bg-danger/20 dark:bg-red-900/30 text-danger rounded-2xl font-bold">Clear</span>
                        </button>
                        <button className="w-full text-left font-semibold text-text-primary p-4 rounded-lg bg-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                            <span>Clear Cached Data</span>
                            <span className="text-xs px-2 py-1 bg-danger/20 dark:bg-red-900/30 text-danger rounded-2xl font-bold">Clear</span>
                        </button>
                    </CrickIQCard>
                </div>
            );
        }

        return (
            <CrickIQCard  className="flex flex-col items-center justify-center text-center h-64 mt-4">
                <svg className="w-16 h-16 text-text-secondary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-xl font-bold text-text-primary">No {title} Yet</h3>
                <p className="text-text-secondary mt-2 text-body">This is a UI placeholder.</p>
            </CrickIQCard>
        );
    };

    return (
        <div className="pb-8 max-w-lg mx-auto w-full">
            {renderContent()}
        </div>
    );
};

const WorkspacePagePlaceholder: React.FC<{ onNavigate: (page: string, title: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="space-y-6 pb-8 max-w-lg mx-auto w-full">
            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">Quick Match History</h4>
                <div className="space-y-2">
                    <button onClick={() => onNavigate('quick_recent', 'Recent Matches')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <span className="font-semibold text-text-primary">Recent Matches</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                    <button onClick={() => onNavigate('quick_completed', 'Completed Matches')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <span className="font-semibold text-text-primary">Completed Matches</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                    <button onClick={() => onNavigate('quick_drafts', 'Saved Draft Matches')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <span className="font-semibold text-text-primary">Saved Draft Matches</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>

            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">Tournament History</h4>
                <div className="space-y-2">
                    <button onClick={() => onNavigate('tourn_active', 'Active Tournaments')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <span className="font-semibold text-text-primary">Active Tournaments</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                    <button onClick={() => onNavigate('tourn_completed', 'Completed Tournaments')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <span className="font-semibold text-text-primary">Completed Tournaments</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                    <button onClick={() => onNavigate('tourn_drafts', 'Draft Tournaments')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <span className="font-semibold text-text-primary">Draft Tournaments</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>

            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">Quick Actions</h4>
                <div className="space-y-2">
                    <button onClick={() => alert("Navigate to active match (placeholder)")} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex items-center gap-4 transition-colors">
                        <div className="p-2 bg-success/20 dark:bg-green-900/30 text-success rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-text-primary">Continue Active Match</span>
                    </button>
                    <button onClick={() => alert("Navigate to active tournament (placeholder)")} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex items-center gap-4 transition-colors">
                        <div className="p-2 bg-brand-blue/20 dark:bg-blue-900/30 text-brand-blue rounded-lg">
                            <TrophyIcon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-text-primary">Continue Tournament</span>
                    </button>
                </div>
            </CrickIQCard>

            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">Data Management</h4>
                <div className="space-y-2">
                    <button onClick={() => onNavigate('storage', 'Manage Storage')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-danger/20 dark:bg-red-900/30 text-danger rounded-lg">
                                <HardDriveIcon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-text-primary">Manage Storage</span>
                        </div>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>
        </div>
    );
};

const UpgradePagePlaceholder: React.FC = () => {
    return (
        <div className="space-y-6 max-w-lg mx-auto pb-8 w-full">
            <CrickIQCard  className="overflow-hidden -yellow-400 dark:-yellow-600">
                <div className=" p-4 text-center">
                    <span className="bg-white/20 text-white text-caption font-bold px-4 py-1 rounded-2xl uppercase tracking-wider">Current Plan</span>
                    <h3 className="text-3xl text-white mt-2">Free</h3>
                    <p className="text-yellow-100">10 Match Trial Active</p>
                </div>
                <div className="p-6 space-y-4  ">
                    <ul className="space-y-2 text-body text-text-primary">
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>10 Match Trial</li>
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Quick Match Only</li>
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>1 Tournament Lifetime</li>
                        <li className="flex items-center gap-2 text-text-secondary"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>With Ads</li>
                    </ul>
                </div>
            </CrickIQCard>

            <div className="space-y-4">
                <h4 className="font-bold text-text-primary text-2xl font-bold px-1">Upgrade to Pro</h4>
                
                <CrickIQCard  className="space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-brand-blue/100 text-white text-[10px] font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wider">Popular</div>
                    <div className="flex justify-between items-center border-b border-brand-blue/15 pb-4">
                        <div>
                            <h5 className="font-bold text-text-primary text-lg">Yearly Pro</h5>
                            <p className="text-sm text-text-secondary mt-1">Best value for regulars</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl text-brand-blue">₹499</span>
                            <span className="text-caption text-text-secondary block">/ year</span>
                        </div>
                    </div>
                    <ul className="space-y-2 text-body text-text-primary">
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Unlimited Usage</li>
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>No Ads</li>
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Cloud Backup</li>
                    </ul>
                    <button className="w-full bg-brand-gradient text-white font-bold py-4 rounded-xl transition-colors shadow-md">Select Yearly</button>
                </CrickIQCard>

                <CrickIQCard  className="space-y-4">
                    <div className="flex justify-between items-center border-b border-brand-blue/15 pb-4">
                        <div>
                            <h5 className="font-bold text-text-primary text-lg">Monthly Pro</h5>
                            <p className="text-sm text-text-secondary mt-1">Flexible short term</p>
                        </div>
                        <div className="text-right">
                            <span className="text-h1 text-text-primary">₹49</span>
                            <span className="text-caption text-text-secondary block">/ month</span>
                        </div>
                    </div>
                    <ul className="space-y-2 text-body text-text-primary">
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Unlimited Usage</li>
                        <li className="flex items-center gap-2 text-text-secondary"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>With Ads</li>
                    </ul>
                    <button className="w-full bg-tertiary border-2 border-brand-blue/15 hover:border-text-secondary text-text-primary font-bold py-4 rounded-xl transition-colors">Select Monthly</button>
                </CrickIQCard>

                <CrickIQCard  className="space-y-4">
                    <div className="flex justify-between items-center border-b border-brand-blue/15 pb-4">
                        <div>
                            <h5 className="font-bold text-text-primary text-lg">Lifetime Pro</h5>
                            <p className="text-sm text-text-secondary mt-1">Pay once, yours forever</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl text-brand-lavender">₹1999</span>
                            <span className="text-caption text-text-secondary block">one time</span>
                        </div>
                    </div>
                    <ul className="space-y-2 text-body text-text-primary">
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-brand-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Unlimited Usage</li>
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-brand-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>No Ads</li>
                        <li className="flex items-center gap-2"><svg className="w-4 h-4 text-brand-lavender" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Premium Features</li>
                    </ul>
                    <button className="w-full bg-brand-gradient text-white font-bold py-4 rounded-xl transition-colors shadow-md">Select Lifetime</button>
                </CrickIQCard>
            </div>

            <CrickIQCard  className="space-y-4">
                <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Billing Details</h4>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Billing Name</label>
                        <input type="text" className="w-full p-3 bg-tertiary border border-brand-blue/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue text-text-primary transition-shadow" placeholder="Guest User" readOnly />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Billing Email</label>
                        <input type="email" className="w-full p-3 bg-tertiary border border-brand-blue/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue text-text-primary transition-shadow" placeholder="[guest@crickiq.app]" readOnly />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Billing Address <span className="opacity-50 font-normal lowercase">(optional)</span></label>
                        <textarea className="w-full p-3 bg-tertiary border border-brand-blue/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue text-text-primary transition-shadow" placeholder="Add billing address" rows={2} readOnly></textarea>
                    </div>
                </div>
                <div className="pt-4 flex gap-2">
                    <button className="flex-1 bg-tertiary border border-brand-blue/15 hover:bg-secondary text-text-primary text-button py-2 rounded-lg transition-colors">Change Method</button>
                    <button className="flex-1 bg-danger/20 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-danger text-button py-2 rounded-lg transition-colors">Delete Method</button>
                </div>
            </CrickIQCard>

            <CrickIQCard  className="space-y-4">
                <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Subscription Management</h4>
                <div className="space-y-2">
                    <div className="flex justify-between items-center py-2">
                        <span className="font-semibold text-text-secondary">Renewal Status</span>
                        <span className="font-bold px-4 py-1 bg-warning/20 text-yellow-800 rounded-2xl text-caption uppercase tracking-wider">Active Free</span>
                    </div>
                    <button className="w-full text-left font-semibold text-text-primary p-4 rounded-lg bg-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                        <span>Cancel Subscription</span>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>

            <CrickIQCard  className="space-y-4">
                <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Purchase History</h4>
                <div className="py-6 flex flex-col items-center justify-center text-center opacity-60">
                    <svg className="w-12 h-12 text-text-secondary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="font-semibold text-text-primary">No Purchases Yet</p>
                    <p className="text-caption text-text-secondary">Your transaction history will appear here.</p>
                </div>
            </CrickIQCard>

            <div className="opacity-60 text-center space-y-2 pt-4">
                <p className="text-xs font-bold text-text-secondary">This is a placeholder page.</p>
                <p className="text-caption text-text-secondary">No payments are processed during Phase 2.5.</p>
            </div>
        </div>
    );
};

const HelpCenterSubPagePlaceholder: React.FC<{ subPage: string, title?: string, onNavigate?: (page: string, title: string) => void }> = ({ subPage, onNavigate }) => {
    const renderContent = () => {
        if (subPage === 'tutorials') {
            return (
                <div className="space-y-4">
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('tut_quick', 'How To Use Quick Match')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">How To Use Quick Match</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">Learn the basics of scoring a single match.</p>
                    </CrickIQCard>
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('tut_tourn', 'How To Create Tournament')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">How To Create Tournament</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">Set up teams and initial tournament rules.</p>
                    </CrickIQCard>
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('tut_fixture', 'How To Generate Fixtures')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">How To Generate Fixtures</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">Generate fixtures for your tournament automatically.</p>
                    </CrickIQCard>
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('tut_backup', 'How To Restore Backup')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">How To Restore Backup</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">Recover your data from a local backup file.</p>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage.startsWith('tut_')) {
            return (
                <CrickIQCard  className="flex flex-col items-center justify-center text-center space-y-4 h-64">
                    <div className="w-16 h-16 bg-brand-blue/20 dark:bg-blue-900/30 text-brand-blue rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">Tutorial content coming soon</h3>
                    <p className="text-sm text-text-secondary max-w-xs">Detailed guides and interactive videos will be placed here.</p>
                </CrickIQCard>
            );
        }

        if (subPage === 'faq') {
            return (
                <div className="space-y-4">
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('faq_sub', 'Subscription FAQs')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">Subscription Questions</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                    </CrickIQCard>
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('faq_bill', 'Billing FAQs')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">Billing Questions</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                    </CrickIQCard>
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('faq_acc', 'Account FAQs')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">Account Questions</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                    </CrickIQCard>
                    <CrickIQCard  className="hover: dark:hover: transition-colors cursor-pointer" onClick={() => onNavigate?.('faq_backup', 'Backup FAQs')}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-text-primary text-body">Backup Questions</span>
                            <span className="text-text-secondary">›</span>
                        </div>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage.startsWith('faq_')) {
            return (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <CrickIQCard key={i}>
                            <h4 className="font-bold text-text-primary text-body mb-2">Example Question {i}?</h4>
                            <p className="text-sm text-text-secondary leading-relaxed">This is static placeholder text for the FAQ answer. It gives a brief explanation of the common query.</p>
                        </CrickIQCard>
                    ))}
                </div>
            );
        }

        if (subPage === 'contact') {
            return (
                <div className="space-y-6">
                    <CrickIQCard  className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 bg-success/20 dark:bg-green-900/30 text-success rounded-full flex items-center justify-center mb-1">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-text-primary text-lg">Email Us</h4>
                        <p className="text-sm text-brand-blue bg-brand-blue/10 px-4 py-2 rounded-2xl select-all">support@crickiq.app</p>
                    </CrickIQCard>

                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-2">Send a Message</h4>
                        <div className="space-y-4 pointer-events-none">
                            <input type="text" placeholder="Subject" className="w-full p-3 bg-tertiary border border-brand-blue/15 rounded-xl" readOnly />
                            <textarea placeholder="Describe your issue..." rows={4} className="w-full p-3 bg-tertiary border border-brand-blue/15 rounded-xl" readOnly></textarea>
                            <button className="w-full bg-brand-blue text-white font-bold py-4 rounded-xl">Send Message</button>
                        </div>
                        <p className="text-caption text-text-secondary text-center mt-2">Support submission is currently a placeholder.</p>
                    </CrickIQCard>

                    <div className="text-center opacity-70">
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Support Hours</p>
                        <p className="text-sm text-text-primary mt-1">Monday - Friday, 9am - 6pm</p>
                    </div>
                </div>
            );
        }

        if (subPage === 'about') {
            return (
                <div className="space-y-6 flex flex-col items-center text-center mt-4">
                    <div className="w-24 h-24  rounded-3xl shadow-lg flex items-center justify-center mb-2">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-h1 text-text-primary">CrickIQ</h2>
                        <p className="text-sm font-bold text-brand-blue mt-1">Version 1.0.0 (Beta)</p>
                    </div>
                    
                    <CrickIQCard  className="space-y-4 max-w-sm w-full text-left mt-4">
                        <h4 className="font-bold text-text-primary text-body">Our Mission</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            To provide the most reliable, offline-first cricket scoring experience for local matches and tournaments anywhere in the world.
                        </p>
                    </CrickIQCard>
                    
                    <div className="flex gap-4 pt-4">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-blue transition-colors">Terms of Service</span>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider cursor-pointer hover:text-brand-blue transition-colors">Privacy Policy</span>
                    </div>
                </div>
            );
        }

        return (
            <CrickIQCard  className="flex flex-col items-center justify-center text-center h-64 mt-4">
                <h3 className="text-xl font-bold text-text-primary">No Content</h3>
            </CrickIQCard>
        );
    };

    return (
        <div className="pb-8 max-w-lg mx-auto w-full">
            {renderContent()}
        </div>
    );
};

const HelpCenterPagePlaceholder: React.FC<{ onNavigate: (page: string, title: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="space-y-4 pb-8 max-w-lg mx-auto w-full">
            <CrickIQCard  className="overflow-hidden">
                <button onClick={() => onNavigate('tutorials', 'Tutorials')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 border-b border-brand-blue/15 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-blue/20 dark:bg-blue-900/30 text-brand-blue rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">Tutorials</span>
                            <p className="text-caption text-text-secondary mt-0.5">Learn how to use CrickIQ</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>

                <button onClick={() => onNavigate('faq', 'FAQ')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 border-b border-brand-blue/15 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-lavender/20 dark:bg-brand-lavender/30 text-brand-lavender rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">FAQ</span>
                            <p className="text-caption text-text-secondary mt-0.5">Frequently asked questions</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>

                <button onClick={() => onNavigate('contact', 'Contact Support')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 border-b border-brand-blue/15 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-success/20 dark:bg-green-900/30 text-success rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">Contact Support</span>
                            <p className="text-caption text-text-secondary mt-0.5">Get help from our team</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>

                <button onClick={() => onNavigate('about', 'About CrickIQ')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-warning/20 dark:bg-warning/20 text-warning rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">About CrickIQ</span>
                            <p className="text-caption text-text-secondary mt-0.5">Version & legal information</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>
            </CrickIQCard>
            
            <div className="opacity-60 text-center space-y-2 pt-4">
                <p className="text-xs font-bold text-text-secondary">This is a UI placeholder structure.</p>
            </div>
        </div>
    );
};

const SettingsSubPagePlaceholder: React.FC<{ subPage: string, title: string }> = ({ subPage }) => {
    const renderContent = () => {
        if (subPage === 'appearance') {
            return (
                <div className="space-y-6">
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Theme</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="border-2 border-brand-blue bg-brand-blue/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors relative overflow-hidden">
                                <div className="absolute top-2 right-2 w-3 h-3 bg-brand-blue rounded-full"></div>
                                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <span className="text-button text-brand-blue">Light Mode</span>
                            </button>
                            <button className="border border-brand-blue/15 bg-primary/50 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
                                <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                <span className="font-semibold text-body text-text-secondary">Dark Mode</span>
                            </button>
                        </div>
                    </CrickIQCard>
                    
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Font Size</h4>
                        <div className="space-y-2">
                            <button className="w-full text-left font-semibold text-text-secondary p-4 rounded-lg bg-primary/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                                <span className="text-sm">Small</span>
                            </button>
                            <button className="w-full text-left font-bold text-text-primary p-4 rounded-lg bg-brand-blue/10 border border-brand-blue transition-colors flex justify-between items-center relative">
                                <span className="text-base">Medium</span>
                                <div className="absolute right-4 w-2 h-2 bg-brand-blue rounded-full"></div>
                            </button>
                            <button className="w-full text-left font-semibold text-text-secondary p-4 rounded-lg bg-primary/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex justify-between items-center">
                                <span className="text-lg">Large</span>
                            </button>
                        </div>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage === 'notifications') {
            return (
                <div className="space-y-4">
                    <CrickIQCard  className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-brand-blue/15 pb-4">
                            <div>
                                <h5 className="font-bold text-text-primary text-body">Match Reminders</h5>
                                <p className="text-caption text-text-secondary mt-0.5">Get notified before a match starts</p>
                            </div>
                            <div className="w-12 h-6 bg-brand-blue rounded-2xl flex items-center justify-end p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-brand-blue/15 pb-4">
                            <div>
                                <h5 className="font-bold text-text-primary text-body">Tournament Alerts</h5>
                                <p className="text-caption text-text-secondary mt-0.5">Updates on your tournaments</p>
                            </div>
                            <div className="w-12 h-6 bg-brand-blue rounded-2xl flex items-center justify-end p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <div>
                                <h5 className="font-bold text-text-primary text-body">Subscription Alerts</h5>
                                <p className="text-caption text-text-secondary mt-0.5">Billing and renewal notices</p>
                            </div>
                            <div className="w-12 h-6 bg-tertiary rounded-2xl flex items-center justify-start p-1 cursor-pointer">
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </div>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage === 'preferences') {
            return (
                <div className="space-y-4">
                    <CrickIQCard  className="space-y-4">
                        <div className="bg-tertiary border border-brand-blue rounded-xl p-4 relative overflow-hidden transition-colors cursor-pointer">
                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-4 border-brand-blue bg-white dark:bg-black"></div>
                            <h5 className="font-bold text-text-primary text-lg">Pro Mode</h5>
                            <p className="text-sm text-brand-blue mt-1 mb-4">Full App Access</p>
                            <ul className="text-caption text-text-secondary space-y-1.5 opacity-80">
                                <li className="flex items-center gap-1.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Quick Match Dashboard</li>
                                <li className="flex items-center gap-1.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Tournament Features</li>
                            </ul>
                        </div>

                        <div className="bg-tertiary border border-brand-blue/15 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl p-4 relative transition-colors cursor-pointer opacity-70">
                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full border-2 border-brand-blue/15"></div>
                            <h5 className="font-bold text-text-primary text-lg">Basic Mode</h5>
                            <p className="text-sm text-text-secondary mt-1 mb-4">Simplified UI</p>
                            <ul className="text-caption text-text-secondary space-y-1.5 opacity-80">
                                <li className="flex items-center gap-1.5"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Quick Match Dashboard Only</li>
                            </ul>
                        </div>
                        
                        <div className="pt-2">
                            <p className="text-caption text-text-secondary text-center">Changing mode placeholder - no real routing logic applied.</p>
                        </div>
                    </CrickIQCard>
                </div>
            );
        }

        return (
            <CrickIQCard  className="flex flex-col items-center justify-center text-center h-64 mt-4">
                <h3 className="text-xl font-bold text-text-primary">No Config Found</h3>
            </CrickIQCard>
        );
    };

    return (
        <div className="pb-8 max-w-lg mx-auto w-full">
            {renderContent()}
        </div>
    );
};

const SettingsPagePlaceholder: React.FC<{ onNavigate: (page: string, title: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="space-y-6 pb-8 max-w-lg mx-auto w-full">
            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">Appearance</h4>
                <div className="space-y-2">
                    <button onClick={() => onNavigate('appearance', 'Appearance')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-1.5 bg-secondary rounded-lg text-text-primary">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-text-primary">Theme & Font Size</span>
                        </div>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>

            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">Notifications</h4>
                <div className="space-y-2">
                    <button onClick={() => onNavigate('notifications', 'Notifications')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-1.5 bg-secondary rounded-lg text-text-primary">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <span className="font-semibold text-text-primary">Match Reminders & Alerts</span>
                        </div>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>

            <CrickIQCard>
                <h4 className="font-bold text-text-primary text-body uppercase tracking-wider mb-4 px-1">App Preferences</h4>
                <div className="space-y-2">
                    <button onClick={() => onNavigate('preferences', 'App Preferences')} className="w-full bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 rounded-xl flex justify-between items-center transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-1.5 bg-secondary rounded-lg text-text-primary">
                                <SettingsIcon className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-text-primary">App Mode Setup</span>
                        </div>
                        <span className="text-text-secondary">›</span>
                    </button>
                </div>
            </CrickIQCard>
            
            <div className="opacity-60 text-center space-y-2 pt-2">
                <p className="text-xs font-bold text-text-secondary">This is a UI placeholder structure.</p>
                <p className="text-caption text-text-secondary">No real preferences are persisted.</p>
            </div>
        </div>
    );
};

const PrivacySubPagePlaceholder: React.FC<{ subPage: string, title?: string, onNavigate?: (page: string, title: string) => void }> = ({ subPage }) => {
    const renderContent = () => {
        if (subPage === 'privacy_policy') {
            return (
                <div className="space-y-6">
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">User Data Privacy</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            CrickIQ is designed offline-first. Your standard match data remains locally on your device unless explicitly synced to the cloud. We do not sell your personal data.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Account Data</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            If you create an account, basic identifying information (such as email) is securely stored to manage your subscription and cloud backups.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Offline Storage</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Match data is stored in your device's local database. Clearing your browser/app data will clear your local match history.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">User Rights</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            You have the right to request deletion of any cloud-synced account data by contacting support. Local data can be deleted from settings.
                        </p>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage === 'terms') {
            return (
                <div className="space-y-6">
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">App Usage Rules</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            By using CrickIQ, you agree to these placeholders. This app is provided as-is for scoring cricket matches.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Tournament Usage</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            You are responsible for the tournament data you generate and distribute.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Limitation of Liability</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            We are not responsible for any lost match data due to device failure, clearing of browser cache, or beta testing.
                        </p>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage === 'refund') {
            return (
                <div className="space-y-6">
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Monthly Plan Policy</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Monthly subscriptions can be cancelled at any time but are non-refundable for the active billing period.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Yearly Plan Policy</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Yearly subscriptions offer a 7-day money-back guarantee. After 7 days, they are non-refundable.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Refund Processing</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Play Store or App Store purchases are subject to the respective platform's refund policies and must be initiated through them. Note this is a placeholder.
                        </p>
                    </CrickIQCard>
                </div>
            );
        }

        if (subPage === 'data_usage') {
            return (
                <div className="space-y-6">
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Match Data Usage</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            Local match data is yours. If synced to the cloud, it is used only to provide your services across devices.
                        </p>
                    </CrickIQCard>
                    <CrickIQCard  className="space-y-4">
                        <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Analytics Usage</h4>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            We may collect anonymous crash reports and usage analytics to improve app stability and user experience.
                        </p>
                    </CrickIQCard>
                </div>
            );
        }

        return (
            <CrickIQCard  className="flex flex-col items-center justify-center text-center h-64 mt-4">
                <h3 className="text-xl font-bold text-text-primary">Legal Information Pending</h3>
            </CrickIQCard>
        );
    };

    return (
        <div className="pb-8 max-w-lg mx-auto w-full">
            {renderContent()}
        </div>
    );
};

const PrivacyPagePlaceholder: React.FC<{ onNavigate: (page: string, title: string) => void }> = ({ onNavigate }) => {
    return (
        <div className="space-y-4 pb-8 max-w-lg mx-auto w-full">
            <CrickIQCard  className="overflow-hidden">
                <button onClick={() => onNavigate('privacy_policy', 'Privacy Policy')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 border-b border-brand-blue/15 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-blue/20 dark:bg-blue-900/30 text-brand-blue rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">Privacy Policy</span>
                            <p className="text-caption text-text-secondary mt-0.5">How we handle your data</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>

                <button onClick={() => onNavigate('terms', 'Terms & Conditions')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 border-b border-brand-blue/15 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-lavender/20 dark:bg-brand-lavender/30 text-brand-lavender rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">Terms & Conditions</span>
                            <p className="text-caption text-text-secondary mt-0.5">App usage rules and agreements</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>

                <button onClick={() => onNavigate('refund', 'Subscription Refund Policy')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 border-b border-brand-blue/15 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-success/20 dark:bg-green-900/30 text-success rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">Subscription Refund Policy</span>
                            <p className="text-caption text-text-secondary mt-0.5">Cancellations and refunds</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>

                <button onClick={() => onNavigate('data_usage', 'Data Usage Policy')} className="w-full text-left bg-primary/50 dark:bg-black/20 hover:bg-secondary p-4 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-warning/20 dark:bg-warning/20 text-warning rounded-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-text-primary text-lg">Data Usage Policy</span>
                            <p className="text-caption text-text-secondary mt-0.5">How we utilize your activity</p>
                        </div>
                    </div>
                    <span className="text-text-secondary text-2xl font-bold">›</span>
                </button>
            </CrickIQCard>
            
            <div className="opacity-60 text-center space-y-2 pt-4">
                <p className="text-xs font-bold text-text-secondary">This is a UI placeholder structure.</p>
                <p className="text-caption text-text-secondary">No real legal systems are connected.</p>
            </div>
        </div>
    );
};

const ProfilePagePlaceholder: React.FC = () => {
    const [name, setName] = useState('Guest User');
    const [mobile, setMobile] = useState('');
    const email = 'guest@crickiq.app';
    const accountType = 'Guest';
    const subscriptionStatus = 'Free';
    const [isEditing, setIsEditing] = useState(false);

    const firstLetter = name.trim().charAt(0).toUpperCase() || 'G';

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-8">
            <div className="flex flex-col items-center pt-4">
                <div className="w-24 h-24  rounded-full flex items-center justify-center mb-2 shadow-lg text-white text-4xl pb-1">
                    {firstLetter}
                </div>
                {!isEditing ? (
                    <h3 className="text-h1 text-text-primary">{name}</h3>
                ) : null}
            </div>

            <CrickIQCard  className="space-y-6">
               <div className="flex justify-between items-center border-b border-brand-blue/15 pb-4">
                    <h4 className="font-bold text-text-primary text-lg">Personal Details</h4>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-brand-blue text-body font-bold hover:underline bg-brand-blue/10 hover:bg-brand-blue/20 px-4 py-1 rounded-2xl transition-colors"
                    >
                        {isEditing ? 'Save' : 'Edit'}
                    </button>
               </div>
               
                <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Name</label>
                    {isEditing ? (
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 mt-1 bg-tertiary border border-brand-blue/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue text-text-primary transition-shadow" placeholder="Your Name" />
                    ) : (
                        <p className="font-bold text-text-primary text-lg">{name}</p>
                    )}
                </div>

                <div className="space-y-1 pt-2 border-t border-brand-blue/15 border-dashed">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
                    <p className="font-medium text-text-secondary flex items-center gap-2">
                        {email}
                        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-brand-blue/15 border-dashed">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Mobile Number <span className="opacity-50 font-normal lowercase">(optional)</span></label>
                    {isEditing ? (
                        <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Add mobile number" className="w-full p-4 mt-1 bg-tertiary border border-brand-blue/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue text-text-primary transition-shadow" />
                    ) : (
                        <p className="font-medium text-text-primary">{mobile || <span className="text-text-secondary italic">Not provided</span>}</p>
                    )}
                </div>
            </CrickIQCard>

            <CrickIQCard  className="space-y-4">
                <h4 className="font-bold text-text-primary text-lg border-b border-brand-blue/15 pb-4">Account Status</h4>
                
                <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-blue/20 dark:bg-blue-900/30 text-brand-blue rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="font-semibold text-text-secondary">Type</span>
                    </div>
                    <span className="font-bold text-text-primary text-lg">{accountType}</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-4">
                         <div className="p-2 bg-warning/20 dark:bg-warning/20 text-warning rounded-lg">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-text-secondary">Subscription</span>
                    </div>
                    <span className="font-bold px-4 py-1 bg-tertiary text-text-secondary rounded-2xl text-caption uppercase tracking-wider">
                        {subscriptionStatus}
                    </span>
                </div>
            </CrickIQCard>
            
            <div className="opacity-60 text-center space-y-2 mt-8">
                <p className="text-xs font-bold text-text-secondary">This is a placeholder page.</p>
                <p className="text-caption text-text-secondary">No data is saved during Phase 2.5.</p>
            </div>
        </div>
    );
};

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose }) => {
    const [activePage, setActivePage] = useState<DrawerPage>(null);
    const [activeSubPage, setActiveSubPage] = useState<{ id: string; title: string } | null>(null);

    const isPopStateRef = useRef(false);

    // Handle manual close by clicking overlay or close button
    const handleManualClose = React.useCallback(() => {
        if (window.history.state && window.history.state.drawerLayer) {
            window.history.back();
        } else {
            if (activeSubPage) {
                setActiveSubPage(null);
            } else if (activePage) {
                setActivePage(null);
            } else {
                onClose();
            }
        }
    }, [activeSubPage, activePage, onClose]);

    // History API for Android Back Button & Escape key handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleManualClose();
            }
        };

        const handlePopState = () => {
            isPopStateRef.current = true;
            if (activeSubPage) {
                setActiveSubPage(null);
            } else if (activePage) {
                setActivePage(null);
            } else if (isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isOpen, activePage, activeSubPage, handleManualClose, onClose]);

    // Push state effect independently
    useEffect(() => {
        if (!isOpen) return;

        if (isPopStateRef.current) {
            // Reset the flag and do not push state if we got here via browser back
            isPopStateRef.current = false;
            return;
        }

        if (activeSubPage) {
            window.history.pushState({ drawerLayer: 3 }, '');
        } else if (activePage) {
            window.history.pushState({ drawerLayer: 2 }, '');
        } else {
            window.history.pushState({ drawerLayer: 1 }, '');
        }
    }, [isOpen, activePage, activeSubPage]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen || activePage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, activePage]);

    const DRAWER_ITEMS = [
        { id: 'profile' as DrawerPage, label: 'Profile', icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        )},
        { id: 'workspace' as DrawerPage, label: 'Workspace', icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        )},
        { id: 'upgrade' as DrawerPage, label: 'Upgrade Pro', icon: <SparklesIcon className="w-5 h-5" />, highlight: true },
        { id: 'backup' as DrawerPage, label: 'Backup & Restore', icon: <HardDriveIcon className="w-5 h-5" /> },
        { id: 'settings' as DrawerPage, label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
        { id: 'help' as DrawerPage, label: 'Help Center', icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )},
        { id: 'privacy' as DrawerPage, label: 'Privacy & Terms', icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )},
        { id: 'logout' as DrawerPage, label: 'Logout', icon: <LogoutIcon className="w-5 h-5" />, danger: true },
    ];

    const renderPlaceholderPage = () => {
        if (!activePage) return null;

        let title = '';
        let content = null;

        switch (activePage) {
            case 'profile':
                title = 'Profile';
                content = <ProfilePagePlaceholder />;
                break;
            case 'workspace':
                title = 'Workspace';
                content = <WorkspacePagePlaceholder onNavigate={(id, title) => setActiveSubPage({ id, title })} />;
                break;
            case 'upgrade':
                title = 'Upgrade Pro';
                content = <UpgradePagePlaceholder />;
                break;
            case 'backup':
                title = 'Backup & Restore';
                content = (
                    <div className="space-y-4">
                        <CrickIQCard  className="flex flex-col justify-center items-center text-center">
                            <HardDriveIcon className="w-12 h-12 mb-4 text-brand-blue" />
                            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">Future Backup System</h3>
                            <p className="text-text-secondary mt-2">Securely backup your matches and tournament data to the cloud.</p>
                        </CrickIQCard>
                        <CrickIQCard  className="flex justify-between items-center dark:">
                            <div>
                                <h4 className="font-bold text-text-primary">Cloud Sync</h4>
                                <p className="text-caption text-text-secondary">Sync data across devices</p>
                            </div>
                            <div className="w-10 h-6 bg-tertiary rounded-2xl"></div>
                        </CrickIQCard>
                        <div className="grid grid-cols-2 gap-4">
                            <CrickIQCard  className="h-32 h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover: dark:hover: transition-colors">
                                <svg className="w-8 h-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="text-button">Export Data</span>
                            </CrickIQCard>
                            <CrickIQCard  className="h-32 h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover: dark:hover: transition-colors">
                                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-button">Import Data</span>
                            </CrickIQCard>
                        </div>
                    </div>
                );
                break;
            case 'settings':
                title = 'Settings';
                content = <SettingsPagePlaceholder onNavigate={(id, title) => setActiveSubPage({ id, title })} />;
                break;
            case 'help':
                title = 'Help Center';
                content = <HelpCenterPagePlaceholder onNavigate={(id, title) => setActiveSubPage({ id, title })} />;
                break;
            case 'privacy':
                title = 'Privacy & Terms';
                content = <PrivacyPagePlaceholder onNavigate={(id, title) => setActiveSubPage({ id, title })} />;
                break;
            case 'logout':
                title = 'Logout';
                content = (
                    <div className="space-y-6 flex flex-col items-center justify-center h-full min-h-[40vh]">
                        <LogoutIcon className="w-16 h-16 text-danger mb-4 opacity-80" />
                        <h3 className="text-h1 text-text-primary text-center">Are you sure?</h3>
                        <p className="text-text-secondary text-center mb-4">This is a placeholder for the future logout confirmation modal.</p>
                        <div className="w-full space-y-4">
                            <button className="w-full py-4 rounded-xl font-bold bg-danger/100 hover:bg-red-600 text-white transition-colors shadow-lg">
                                Yes, Logout (Placeholder)
                            </button>
                            <button onClick={handleManualClose} className="w-full py-4 rounded-xl font-bold bg-tertiary border border-brand-blue/15 text-text-primary hover:bg-secondary transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                );
                break;
            default:
                break;
        }

        return (
            <div className={`fixed inset-0 z-[350] bg-primary transition-transform duration-300 transform ${activePage ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full !pb-0 safe-pad-t safe-pad-b safe-pad-l safe-pad-r">
                    <header className="p-4  shadow-md flex items-center gap-4">
                        <button onClick={handleManualClose} className="p-2 -ml-2 rounded-2xl text-white hover:bg-white/20 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h2 className="text-xl text-white">{title}</h2>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 bg-secondary font-sans text-body relative">
                        {content}
                    </div>
                    
                    {/* Sub-page Overlay */}
                    <div className={`absolute inset-0 z-[360] bg-primary transition-transform duration-300 transform flex flex-col ${activeSubPage ? 'translate-x-0' : 'translate-x-full'}`}>
                        <header className="p-4  shadow-md flex items-center gap-4">
                            <button onClick={handleManualClose} className="p-2 -ml-2 rounded-2xl text-white hover:bg-white/20 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h2 className="text-xl text-white truncate pr-4">{activeSubPage?.title}</h2>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 bg-secondary font-sans text-body">
                            {activeSubPage && activePage === 'workspace' && <WorkspaceSubPagePlaceholder subPage={activeSubPage.id} title={activeSubPage.title} />}
                            {activeSubPage && activePage === 'settings' && <SettingsSubPagePlaceholder subPage={activeSubPage.id} title={activeSubPage.title} />}
                            {activeSubPage && activePage === 'help' && <HelpCenterSubPagePlaceholder subPage={activeSubPage.id} title={activeSubPage.title} onNavigate={(id, title) => setActiveSubPage({ id, title })} />}
                            {activeSubPage && activePage === 'privacy' && <PrivacySubPagePlaceholder subPage={activeSubPage.id} title={activeSubPage.title} onNavigate={(id, title) => setActiveSubPage({ id, title })} />}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div 
                className={`fixed inset-0 z-[300] transition-opacity duration-300 ${isOpen && !activePage ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                aria-hidden={!isOpen || !!activePage}
            >
                {/* Overlay backdrop */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                    onClick={handleManualClose}
                    aria-hidden="true"
                />
                
                {/* Drawer panel */}
                <div 
                    className={`absolute top-0 left-0 bottom-0 flex flex-col w-72 max-w-[85vw] bg-primary shadow-2xl transition-transform duration-300 ease-in-out transform ${(isOpen && !activePage) ? 'translate-x-0' : '-translate-x-full'} safe-pad-t safe-pad-b safe-pad-l z-10`}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center  shadow-md">
                        <h2 className="text-2xl font-display">
                            <span className="text-white">Crick<span className="text-white font-sharp-cardinal">IQ</span></span>
                        </h2>
                        <button 
                            onClick={handleManualClose}
                            className="p-2 -mr-2 rounded-2xl hover:bg-white/20 transition-colors text-white"
                            aria-label="Close drawer"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto py-2 flex flex-col">
                        <nav className="flex-1 space-y-1 px-2 font-sans text-text-primary">
                            {DRAWER_ITEMS.map((item) => {
                                // Add a subtle divider before Settings
                                const isSettings = item.id === 'settings';
                                return (
                                    <React.Fragment key={item.id}>
                                        {isSettings && <div className="h-px bg-border-color my-4 mx-2 border-t border-dashed" />}
                                        <button
                                            onClick={() => setActivePage(item.id)}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group
                                                ${item.highlight ? 'bg-brand-gradient text-white border-0 text-warning dark:text-white' : 
                                                  item.danger ? 'text-danger hover:bg-danger/10 dark:hover:bg-danger/100/10' : 
                                                  'hover:bg-primary'}
                                            `}
                                        >
                                            <div className={`p-1.5 rounded-lg transition-colors
                                                ${item.highlight ? 'bg-yellow-400/20 text-warning dark:text-white' :
                                                  item.danger ? 'bg-danger/20 dark:bg-red-900/30 text-danger' :
                                                  'bg-primary shadow-md border border-light-border dark:border-brand-blue/15 text-text-secondary group-hover:text-brand-blue'}
                                            `}>
                                                {item.icon}
                                            </div>
                                            <span className="text-button md:text-base">
                                                {item.label}
                                            </span>
                                            {item.highlight && (
                                                <span className="ml-auto text-[10px] uppercase tracking-wider bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-2xl">
                                                    Pro
                                                </span>
                                            )}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </nav>
                    </div>
                    
                    <div className="p-4 border-t border-brand-blue/15 mt-auto text-center font-sans">
                        <p className="text-xs font-bold text-text-secondary">Version 1.0.0</p>
                    </div>
                </div>
            </div>

            {/* Render placeholder pages as full-screen overlays */}
            {renderPlaceholderPage()}
        </>
    );
};

export default Drawer;
