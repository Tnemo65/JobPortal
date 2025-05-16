import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE } from '@/utils/constant';

const JobSummary = ({ jobId }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!jobId) return;
      
      setLoading(true);
      try {
        // Gọi API tóm tắt công việc
        const response = await axios.get(`${API_BASE}/ai/summarize/job/${jobId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setSummary(response.data.summary);
        } else {
          setError('Không thể tải tóm tắt công việc');
        }
      } catch (err) {
        console.error('Error fetching job summary:', err);
        setError('Đã xảy ra lỗi khi tải tóm tắt công việc');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [jobId]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-2" />
        <p className="text-muted-foreground">Đang tạo tóm tắt công việc...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-3">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.reload()}
          className="border-accent text-accent hover:bg-accent/10"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <FileText className="mr-2 h-5 w-5 text-accent" />
          Tóm tắt công việc
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {expanded && (
        <div 
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }}
        />
      )}
    </>
  );
};

export default JobSummary;