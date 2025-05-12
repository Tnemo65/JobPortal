import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2, Wand2, Check, RotateCcw, Copy } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setSingleJob } from '@/redux/jobSlice';

const ImproveDescriptionPanel = ({ jobId, originalDescription }) => {
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const dispatch = useDispatch();
  
  // Hàm tạo mô tả cải thiện
  const generateImprovedDescription = async () => {
    if (!jobId) {
      toast.error("ID công việc không hợp lệ");
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE}/ai/improve-description/${jobId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setImprovedDescription(response.data.improvedDescription);
        toast.success("Đã tạo mô tả công việc cải thiện thành công");
      }
      
    } catch (error) {
      console.error('Error generating improved description:', error);
      toast.error(error.response?.data?.message || "Không thể tạo mô tả cải thiện");
    } finally {
      setLoading(false);
    }
  };
  
  // Hàm cập nhật mô tả vào database
  const updateDescription = async () => {
    if (!improvedDescription) {
      toast.error("Chưa có mô tả cải thiện để cập nhật");
      return;
    }
    
    try {
      setUpdating(true);
      
      const response = await axios.put(`${API_BASE}/ai/update-description/${jobId}`, {
        description: improvedDescription
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        toast.success("Đã cập nhật mô tả công việc thành công");
        
        // Cập nhật state Redux với công việc đã cập nhật
        dispatch(setSingleJob(response.data.job));
      }
      
    } catch (error) {
      console.error('Error updating job description:', error);
      toast.error(error.response?.data?.message || "Không thể cập nhật mô tả công việc");
    } finally {
      setUpdating(false);
    }
  };
  
  // Sao chép mô tả vào clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(improvedDescription);
    toast.success("Đã sao chép mô tả vào clipboard");
  };
  
  return (
    <Card className="border-t-4 border-accent/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-accent" />
          Cải thiện mô tả công việc bằng AI
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!improvedDescription ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-6">
              Sử dụng AI để tạo mô tả công việc hấp dẫn, chuyên nghiệp và có cấu trúc rõ ràng hơn dựa trên thông tin hiện có.
            </p>
            
            <Button
              onClick={generateImprovedDescription}
              disabled={loading}
              className="bg-accent hover:bg-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo mô tả cải thiện...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Tạo mô tả cải thiện
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{showOriginal ? 'Mô tả gốc' : 'Mô tả đã cải thiện'}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowOriginal(!showOriginal)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {showOriginal ? 'Xem bản cải thiện' : 'Xem bản gốc'}
              </Button>
            </div>
            
            <div className="relative">
              <Textarea
                value={showOriginal ? originalDescription : improvedDescription}
                onChange={e => !showOriginal && setImprovedDescription(e.target.value)}
                readOnly={showOriginal}
                className={`min-h-[300px] ${showOriginal ? 'bg-muted' : 'border-accent/30 bg-accent/5'}`}
              />
              
              {!showOriginal && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> 
                  Copy
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {improvedDescription && !showOriginal && (
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={generateImprovedDescription}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Tạo lại mô tả
          </Button>
          
          <Button 
            onClick={updateDescription}
            disabled={updating}
            className="bg-accent hover:bg-accent/90"
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Cập nhật mô tả
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ImproveDescriptionPanel;