import React, { useState, useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Team } from '../types';
import { detectDuplicateTeams } from '../utils/teamNormalization';
import { LOGO_OPTIONS } from '../utils/initialData';

interface EditTeamSheetProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team;
    teams: Team[];
    updateTeamProfile: (
        teamId: string,
        updates: {
            name: string;
            shortName?: string;
            teamType?: Team["teamType"];
            logoColor?: string;
            logoUrl?: string;
            homeGround?: string;
            city?: string;
            state?: string;
            country?: string;
        }
    ) => Team | null;
    onSuccess?: (team: Team) => void;
}

const TEAM_TYPES: { value: Team['teamType']; label: string }[] = [
    { value: 'local', label: 'Local' },
    { value: 'club', label: 'Club' },
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'academy', label: 'Academy' },
    { value: 'domestic', label: 'Domestic' },
    { value: 'franchise', label: 'Franchise' },
    { value: 'national', label: 'National' },
    { value: 'custom', label: 'Custom' }
];

export const EditTeamSheet: React.FC<EditTeamSheetProps> = ({
    isOpen,
    onClose,
    team,
    teams,
    updateTeamProfile,
    onSuccess
}) => {
    const [name, setName] = useState(team.name || '');
    const [shortName, setShortName] = useState(team.shortName || '');
    const [teamType, setTeamType] = useState<Team['teamType']>(team.teamType || 'custom');
    const [logoColor, setLogoColor] = useState(team.logoColor || team.logo || '#3B82F6');
    const [homeGround, setHomeGround] = useState(team.homeGround || '');
    const [city, setCity] = useState(team.city || '');
    const [state, setState] = useState(team.state || '');
    const [country, setCountry] = useState(team.country || '');

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Track duplicate names dynamically (render-time calculation, excluding current team ID)
    const duplicateTeams = useMemo(() => {
        const trimmedName = name.trim();
        if (trimmedName.length >= 2) {
            const matches = detectDuplicateTeams(trimmedName, teams);
            return matches.filter(t => t.id !== team.id);
        }
        return [];
    }, [name, teams, team.id]);

    // Check if initial values have changed
    const hasChanges = useMemo(() => {
        return (
            name.trim() !== (team.name || '').trim() ||
            shortName.trim() !== (team.shortName || '').trim() ||
            teamType !== (team.teamType || 'custom') ||
            logoColor !== (team.logoColor || team.logo || '#3B82F6') ||
            homeGround.trim() !== (team.homeGround || '').trim() ||
            city.trim() !== (team.city || '').trim() ||
            state.trim() !== (team.state || '').trim() ||
            country.trim() !== (team.country || '').trim()
        );
    }, [name, shortName, teamType, logoColor, homeGround, city, state, country, team]);

    // Validation
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const trimmedName = name.trim();

        if (!trimmedName) {
            newErrors.name = 'Team name is required';
        } else if (trimmedName.length < 2) {
            newErrors.name = 'Team name must be at least 2 characters';
        } else if (trimmedName.length > 50) {
            newErrors.name = 'Team name cannot exceed 50 characters';
        }

        if (shortName.trim() && shortName.trim().length > 8) {
            newErrors.shortName = 'Short name cannot exceed 8 characters';
        }

        if (homeGround.trim() && homeGround.trim().length > 50) {
            newErrors.homeGround = 'Home ground cannot exceed 50 characters';
        }
        if (city.trim() && city.trim().length > 50) {
            newErrors.city = 'City name cannot exceed 50 characters';
        }
        if (state.trim() && state.trim().length > 50) {
            newErrors.state = 'State name cannot exceed 50 characters';
        }
        if (country.trim() && country.trim().length > 50) {
            newErrors.country = 'Country name cannot exceed 50 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) return;
        if (!hasChanges) return;

        const updated = updateTeamProfile(team.id, {
            name: name.trim(),
            shortName: shortName.trim() ? shortName.trim().toUpperCase() : undefined,
            teamType,
            logoColor,
            homeGround: homeGround.trim() || undefined,
            city: city.trim() || undefined,
            state: state.trim() || undefined,
            country: country.trim() || undefined
        });

        if (updated) {
            if (onSuccess) {
                onSuccess(updated);
            }
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Form Container */}
                    <motion.div
                        id="edit-team-sheet-container"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="relative bg-primary border-t md:border border-brand-blue/15 w-full md:max-w-xl md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
                        style={{ contentVisibility: 'auto' }}
                    >
                        {/* Drag Handle on Mobile */}
                        <div className="flex md:hidden justify-center py-2.5">
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-brand-blue/5 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-bold text-text-primary tracking-tight">Edit Team Info</h3>
                                <p className="text-xs text-text-secondary">Update safe profile details. Match history and scorecards remain protected.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-secondary rounded-full transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body - Scrollable */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                            {/* Duplicates Warning segment */}
                            {duplicateTeams.length > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-2.5 dark:bg-amber-500/5">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-amber-500 font-sans">Another similar team already exists</h4>
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                            A team named &ldquo;<span className="font-semibold text-text-primary">{duplicateTeams[0].name}</span>&rdquo; is already saved. Duplicate names are allowed, but consider using initials if needed.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-team-name-input" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Team Name *
                                    </label>
                                    <input
                                        id="edit-team-name-input"
                                        type="text"
                                        placeholder="e.g. India, Mumbai Indians"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) {
                                                const updated = { ...errors };
                                                delete updated.name;
                                                setErrors(updated);
                                            }
                                        }}
                                        className={`w-full px-4 py-3 bg-secondary text-text-primary border ${errors.name ? 'border-red-500 ring-1 ring-red-500/20' : 'border-brand-blue/15'} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                        autoComplete="off"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500 font-semibold">{errors.name}</p>
                                    )}
                                </div>

                                {/* Short Name & Team Type Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Short Name */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-team-short-name" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Short Name / Initials
                                        </label>
                                        <input
                                            id="edit-team-short-name"
                                            type="text"
                                            placeholder="e.g. IND, MI"
                                            value={shortName}
                                            onChange={(e) => {
                                                const val = e.target.value.substring(0, 8);
                                                setShortName(val);
                                                if (errors.shortName) {
                                                    const updated = { ...errors };
                                                    delete updated.shortName;
                                                    setErrors(updated);
                                                }
                                            }}
                                            className={`w-full px-4 py-3 bg-secondary text-text-primary border ${errors.shortName ? 'border-red-500' : 'border-brand-blue/15'} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all uppercase`}
                                        />
                                        {errors.shortName ? (
                                            <p className="text-xs text-red-500 font-semibold">{errors.shortName}</p>
                                        ) : (
                                            <p className="text-[10px] text-text-secondary font-sans">Max 8 letters. Defaults to full name if empty.</p>
                                        )}
                                    </div>

                                    {/* Team Type Dropdown */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-team-type-select" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                            Team Type
                                        </label>
                                        <select
                                            id="edit-team-type-select"
                                            value={teamType}
                                            onChange={(e) => setTeamType(e.target.value as Team['teamType'])}
                                            className="w-full h-11 px-4 bg-secondary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all cursor-pointer"
                                        >
                                            {TEAM_TYPES.map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Logo Color Selection Palette */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Logo / Theme Color
                                    </label>
                                    <div className="flex flex-wrap gap-2.5 p-3 bg-secondary border border-brand-blue/10 rounded-2xl justify-start">
                                        {LOGO_OPTIONS.map((color) => {
                                            const isSelected = logoColor === color;
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setLogoColor(color)}
                                                    className={`w-7 h-7 rounded-full border-2 transition-all duration-150 transform hover:scale-110 cursor-pointer ${
                                                        isSelected ? 'border-text-primary scale-110 shadow-md ring-2 ring-brand-blue/30' : 'border-transparent'
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Stadium & Location Section */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-brand-blue/5 pb-1 mb-3">
                                        Location & Home Ground (Optional)
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Home Ground */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="edit-team-home-ground" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                Home Ground
                                            </label>
                                            <input
                                                id="edit-team-home-ground"
                                                type="text"
                                                placeholder="e.g. Wankhede Stadium"
                                                value={homeGround}
                                                onChange={(e) => {
                                                    setHomeGround(e.target.value);
                                                    if (errors.homeGround) {
                                                        const updated = { ...errors };
                                                        delete updated.homeGround;
                                                        setErrors(updated);
                                                    }
                                                }}
                                                className={`w-full px-4 py-3 bg-secondary text-text-primary border ${errors.homeGround ? 'border-red-500' : 'border-brand-blue/15'} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                            />
                                            {errors.homeGround && (
                                                <p className="text-xs text-red-500 font-semibold">{errors.homeGround}</p>
                                            )}
                                        </div>

                                        {/* City, State, Country multi-grid */}
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* City */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="edit-team-city" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                                    City
                                                </label>
                                                <input
                                                    id="edit-team-city"
                                                    type="text"
                                                    placeholder="Mumbai"
                                                    value={city}
                                                    onChange={(e) => {
                                                        setCity(e.target.value);
                                                        if (errors.city) {
                                                            const updated = { ...errors };
                                                            delete updated.city;
                                                            setErrors(updated);
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-2.5 bg-secondary text-text-primary border ${errors.city ? 'border-red-500' : 'border-brand-blue/15'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                                />
                                                {errors.city && (
                                                    <p className="text-[10px] text-red-500 font-semibold">{errors.city}</p>
                                                )}
                                            </div>

                                            {/* State */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="edit-team-state" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                                    State
                                                </label>
                                                <input
                                                    id="edit-team-state"
                                                    type="text"
                                                    placeholder="MH"
                                                    value={state}
                                                    onChange={(e) => {
                                                        setState(e.target.value);
                                                        if (errors.state) {
                                                            const updated = { ...errors };
                                                            delete updated.state;
                                                            setErrors(updated);
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-2.5 bg-secondary text-text-primary border ${errors.state ? 'border-red-500' : 'border-brand-blue/15'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                                />
                                                {errors.state && (
                                                    <p className="text-[10px] text-red-500 font-semibold">{errors.state}</p>
                                                )}
                                            </div>

                                            {/* Country */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="edit-team-country" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                                    Country
                                                </label>
                                                <input
                                                    id="edit-team-country"
                                                    type="text"
                                                    placeholder="India"
                                                    value={country}
                                                    onChange={(e) => {
                                                        setCountry(e.target.value);
                                                        if (errors.country) {
                                                            const updated = { ...errors };
                                                            delete updated.country;
                                                            setErrors(updated);
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-2.5 bg-secondary text-text-primary border ${errors.country ? 'border-red-500' : 'border-brand-blue/15'} rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                                />
                                                {errors.country && (
                                                    <p className="text-[10px] text-red-500 font-semibold">{errors.country}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer Options */}
                        <div className="px-6 py-4 bg-secondary border-t border-brand-blue/5 flex items-center justify-end gap-3 safe-pad-b">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-brand-blue/15 hover:bg-gray-100 dark:hover:bg-white/5 text-text-secondary rounded-2xl font-bold text-sm transition-all focus:outline-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={!hasChanges || name.trim().length < 2}
                                className={`px-6 py-2.5 bg-brand-blue text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 focus:outline-none cursor-pointer ${
                                    (!hasChanges || name.trim().length < 2) ? 'opacity-40 cursor-not-allowed shadow-none' : 'hover:bg-brand-blue/90'
                                }`}
                            >
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
