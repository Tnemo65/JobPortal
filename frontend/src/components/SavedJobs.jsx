import React from 'react'
import Navbar from './shared/Navbar'
import { useSelector } from 'react-redux'
import Job from './Job'
import { Bookmark, Loader2 } from 'lucide-react'
import useGetSavedJobs from '@/hooks/useGetSavedJobs'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'

const SavedJobs = () => {
    const { savedJobs } = useSelector(store => store.auth);
    const { loading } = useGetSavedJobs();
    const navigate = useNavigate();

    return (
        <div>
            <Navbar />
            <div className='max-w-7xl mx-auto my-10 px-4'>
                <div className='flex items-center justify-between mb-6'>
                    <h1 className='font-bold text-2xl flex items-center gap-2'>
                        <Bookmark className="text-accent" />
                        Saved Jobs ({savedJobs?.length || 0})
                    </h1>
                    <Button 
                        onClick={() => navigate('/jobs')} 
                        variant="outline"
                        className="border-accent text-accent hover:bg-accent/10"
                    >
                        Browse More Jobs
                    </Button>
                </div>

                {loading ? (
                    <div className='flex justify-center items-center h-64'>
                        <Loader2 className='h-8 w-8 animate-spin text-accent' />
                    </div>
                ) : savedJobs?.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {savedJobs.map(job => (
                            <motion.div
                                key={job._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Job job={job} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className='bg-white p-8 rounded-lg shadow-md text-center border border-secondary/20'>
                        <div className='mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4'>
                            <Bookmark className='h-8 w-8 text-accent' />
                        </div>
                        <h2 className='text-xl font-bold mb-2'>You haven't saved any jobs yet</h2>
                        <p className='text-muted-foreground mb-6'>Save jobs that interest you to view them later and track your applications.</p>
                        <Button 
                            onClick={() => navigate('/jobs')}
                            className='bg-accent hover:bg-accent/90'
                        >
                            Browse Jobs
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SavedJobs