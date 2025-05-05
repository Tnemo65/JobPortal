import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, MoreHorizontal, Building, Plus } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { format } from 'date-fns'

const CompaniesTable = () => {
    const { companies, searchCompanyByText } = useSelector(store => store.company);
    const [filterCompany, setFilterCompany] = useState([]);
    const navigate = useNavigate();
    
    // Format date helper
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch (error) {
            return dateString.split('T')[0] || "N/A";
        }
    };

    useEffect(() => {
        console.log("Companies from redux:", companies); // Debug log
        if (Array.isArray(companies)) {
            const filteredCompany = companies.filter((company) => {
                if(!searchCompanyByText){
                    return true;
                }
                return company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase());
            });
            setFilterCompany(filteredCompany);
        } else {
            setFilterCompany([]);
        }
    }, [companies, searchCompanyByText]);
    
    // Handle empty state
    if (!Array.isArray(companies) || companies.length === 0) {
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
                <p className="text-gray-500 mb-6">
                    {searchCompanyByText ? 
                        "No companies match your search criteria." : 
                        "You haven't created any companies yet."}
                </p>
                <Button 
                    onClick={() => navigate('/admin/companies/create')}
                    className="bg-accent hover:bg-accent/90"
                >
                    Create Your First Company
                </Button>
            </div>
        );
    }
    
    // Handle when filter returns empty result
    if (filterCompany.length === 0 && searchCompanyByText) {
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Companies Found</h3>
                <p className="text-gray-500 mb-4">No companies match your search criteria.</p>
                <Button 
                    variant="outline"
                    onClick={() => navigate('/admin/companies')}
                >
                    Clear Search
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <Table>
                <TableCaption>A list of your registered companies</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filterCompany.map((company) => (
                        <TableRow key={company._id}>
                            <TableCell>
                                <Avatar className="h-10 w-10 rounded-md">
                                    {company.logo ? (
                                        <AvatarImage src={company.logo} alt={company.name} />
                                    ) : (
                                        <AvatarFallback className="bg-accent/10 text-accent rounded-md">
                                            {company.name?.substring(0, 2).toUpperCase() || "CO"}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{company.name}</TableCell>
                            <TableCell>{formatDate(company.createdAt)}</TableCell>
                            <TableCell className="text-right cursor-pointer">
                                <Popover>
                                    <PopoverTrigger>
                                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 cursor-pointer hover:bg-gray-100">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40" align="end">
                                        <div onClick={() => navigate(`/admin/companies/${company._id}`)} className='flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent/10 transition-colors'>
                                            <Edit2 className='w-4 h-4 text-accent' />
                                            <span>Edit Details</span>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default CompaniesTable