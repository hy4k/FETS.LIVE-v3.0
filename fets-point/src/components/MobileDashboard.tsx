import React from 'react';
import { motion } from 'framer-motion';
import { navigationGroups } from './Sidebar';
import { useAuth } from '../hooks/useAuth';

interface MobileDashboardProps {
    onNavigate: (tab: string) => void;
}

export function MobileDashboard({ onNavigate }: MobileDashboardProps) {
    const { profile } = useAuth();

    // Combine all groups into a single list for the grid, handling role permissions
    const getAllItems = () => {
        const allItems: any[] = [];
        Object.entries(navigationGroups).forEach(([groupName, items]) => {
            items.forEach(item => {
                // Permission check
                if (item.role && !item.role.includes(profile?.role || '')) {
                    return;
                }
                allItems.push({ ...item, groupName });
            });
        });
        return allItems;
    };

    const menuItems = getAllItems();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemAnim = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-6 min-h-[80vh] flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-500">Select an application to start</p>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-6 w-full max-w-md"
            >
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <motion.button
                            key={item.id}
                            variants={itemAnim}
                            onClick={() => onNavigate(item.id)}
                            className="neomorphic-card flex flex-col items-center justify-center p-6 gap-4 aspect-square active:scale-95 transition-transform"
                        >
                            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-400/10 text-yellow-700">
                                <Icon size={32} />
                            </div>
                            <span className="font-semibold text-gray-700 text-sm text-center font-bold">
                                {item.name}
                            </span>
                            {item.badge && (
                                <span className="absolute top-4 right-4 text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </motion.div>
        </div>
    );
}
