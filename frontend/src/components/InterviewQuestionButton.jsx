import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Loader2, HelpCircle, Briefcase, Sparkles, User, Copy } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '@/utils/constant';
import { toast } from 'sonner';

const InterviewQuestionButton = ({ jobId, jobTitle }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [categories, setCategories] = useState({
    technical: [],
    experience: [],
    culture: []
  });

const fetchInterviewQuestions = async () => {
    const fallbackData = `
I. CÂU HỎI KỸ THUẬT/CHUYÊN MÔN:
Câu 1: Hãy mô tả kinh nghiệm của bạn với công nghệ/kỹ năng chính liên quan đến vị trí này?
Mục đích: Đánh giá kiến thức và kinh nghiệm thực tế của ứng viên với các công nghệ/kỹ năng cốt lõi.
Gợi ý: Nêu rõ các dự án đã làm, vai trò, thời gian sử dụng công nghệ, thách thức đã gặp và cách giải quyết.

II. CÂU HỎI VỀ KINH NGHIỆM:
Câu 1: Hãy kể về một tình huống khó khăn trong công việc trước đây và cách bạn đã giải quyết nó?
Mục đích: Đánh giá khả năng giải quyết vấn đề và đối mặt với thách thức.
Gợi ý: Mô tả rõ vấn đề, cách tiếp cận, các bước giải quyết và kết quả đạt được. Nêu bài học rút ra từ tình huống đó.

III. CÂU HỎI VỀ TÍNH CÁCH VÀ PHÙ HỢP VĂN HÓA:
Câu 1: Bạn thích làm việc trong môi trường như thế nào và tại sao?
Mục đích: Đánh giá sự phù hợp của ứng viên với văn hóa công ty.
Gợi ý: Mô tả môi trường làm việc lý tưởng, cách giao tiếp ưa thích, và cách bạn đóng góp vào văn hóa tích cực tại nơi làm việc.
`;

    console.log("Interview Questions Button - JobID:", jobId);
    
      setLoading(true); // Đặt loading = true ngay từ đầu
  if (!jobId) {
    console.error("Missing jobId, cannot fetch interview questions");
    toast.error("Thiếu thông tin công việc, không thể tải câu hỏi");
    setLoading(false);
    return;
  }
  try {
        console.log(`Calling API: ${API_BASE}/ai/interview-questions/${jobId}`);

    // Xóa withCredentials để không gửi cookie xác thực
    const response = await axios.get(`${API_BASE}/ai/interview-questions/${jobId}`, {
      timeout: 30000 // 30 giây
    });
        console.log("API response:", response.data);


    if (response.data.success) {
    const cleanedQuestions = response.data.questions
    .replace(/\*\*/g, '')  // Loại bỏ dấu **
    .replace(/\*/g, '')    // Loại bỏ dấu *
    .replace(/\_/g, '')    // Loại bỏ dấu _
    .replace(/\#/g, '');   // Loại bỏ dấu #

      setQuestions(response.data.questions);
      parseQuestions(response.data.questions);
    } else {
      toast.error(response.data.message || "Không thể tải câu hỏi phỏng vấn");
    }
} catch (error) {
      console.log("Using fallback interview questions data");
  setQuestions(fallbackData);
  parseQuestions(fallbackData);
    console.error('Error fetching interview questions:', error);
    const errorMessage = error.response?.data?.message || 
                        "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

const parseQuestions = (questionsText) => {
  try {
    // Định nghĩa các pattern để tìm các phần
    const patternTechnical = /I\.\s*CÂU HỎI KỸ THUẬT\/CHUYÊN MÔN:([\s\S]*?)(?=II\.|$)/i;
    const patternExperience = /II\.\s*CÂU HỎI VỀ KINH NGHIỆM:([\s\S]*?)(?=III\.|$)/i;
    const patternCulture = /III\.\s*CÂU HỎI VỀ TÍNH CÁCH VÀ PHÙ HỢP VĂN HÓA:([\s\S]*?)(?=$)/i;
    
    // Trích xuất nội dung của từng phần
    const technicalContent = questionsText.match(patternTechnical)?.[1] || '';
    const experienceContent = questionsText.match(patternExperience)?.[1] || '';
    const cultureContent = questionsText.match(patternCulture)?.[1] || '';
    
    // Hàm xử lý và trích xuất câu hỏi từ nội dung
    const extractQuestions = (content) => {
      const questions = [];
      
      // Tìm tất cả các câu hỏi trong nội dung
      const questionPattern = /Câu\s*\d+\s*:\s*(.*?)(?=Mục đích:|$)/gi;
      const purposePattern = /Mục đích\s*:\s*(.*?)(?=Gợi ý:|$)/gi;
      const suggestionPattern = /Gợi ý\s*:\s*([\s\S]*?)(?=Câu\s*\d+\s*:|$)/gi;
      
      // Tách thành các block câu hỏi (mỗi câu hỏi là một block)
      const questionBlocks = content.split(/Câu\s*\d+\s*:/i).filter(block => block.trim());
      
      // Xử lý từng block
      questionBlocks.forEach(block => {
        if (!block.trim()) return;
        
        // Loại bỏ các ký tự markdown
        block = block.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '').replace(/_/g, '');
        
        // Tách các phần từ block
        const parts = block.split(/Mục đích:|Gợi ý:/i);
        
        const question = parts[0]?.trim();
        const purpose = parts[1]?.trim();
        const suggestions = parts[2]?.trim();
        
        if (question) {
          questions.push({
            question,
            purpose,
            suggestions 
          });
        }
      });
      
      return questions;
    };
    
    // Xử lý và set state cho từng loại
    setCategories({
      technical: extractQuestions(technicalContent),
      experience: extractQuestions(experienceContent),
      culture: extractQuestions(cultureContent)
    });
  } catch (error) {
    console.error('Error parsing questions:', error);
    // Đảm bảo có dữ liệu mặc định để hiển thị khi parse lỗi
    setCategories({
      technical: [],
      experience: [],
      culture: []
    });
  }
};

  const extractQuestionsByCategory = (content, ...keywords) => {
    const questions = [];
    const sections = content.split(/\n\n|\r\n\r\n/);
    
    let currentSection = null;
    
    for (const section of sections) {
      if (keywords.some(keyword => 
        section.toLowerCase().includes(keyword.toLowerCase()) && 
        (section.toLowerCase().includes("câu hỏi") || section.toLowerCase().includes("phần"))
      )) {
        currentSection = section;
        continue;
      }
      
      if (currentSection && section.match(/^\d+[\.\)]/) && keywords.some(keyword => currentSection.toLowerCase().includes(keyword.toLowerCase()))) {
        const questionParts = section.split(/\n/);
        const questionText = questionParts[0].replace(/^\d+[\.\)]/, '').trim();
        
        let purpose = '';
        let suggestions = '';
        
        for (let i = 1; i < questionParts.length; i++) {
          const part = questionParts[i].trim();
          if (part.toLowerCase().startsWith('mục đích:')) {
            purpose = part.replace(/^mục đích:/i, '').trim();
          } else if (part.toLowerCase().startsWith('gợi ý')) {
            suggestions = part.replace(/^gợi ý.*?:/i, '').trim();
            
            for (let j = i + 1; j < questionParts.length; j++) {
              if (questionParts[j] && !questionParts[j].match(/^(mục đích|gợi ý)/i)) {
                suggestions += ' ' + questionParts[j].trim();
              }
            }
          }
        }
        
        questions.push({
          question: questionText,
          purpose,
          suggestions
        });
      }
    }
    
    return questions;
  };
  
  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (newOpen && !questions) {
      fetchInterviewQuestions();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Đã sao chép vào clipboard');
    }).catch(() => {
      toast.error('Không thể sao chép');
    });
  };

  const QuestionGroup = ({ questions, icon }) => (
    <div className="space-y-3 mt-2">
      {questions.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          Không có câu hỏi nào trong mục này
        </p>
      ) : (
        questions.map((q, index) => (
          <Accordion type="single" collapsible key={index}>
            <AccordionItem value={`question-${index}`} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-2.5 hover:no-underline">
                <div className="flex items-start gap-3 text-left">
                  <div className="mt-0.5 bg-accent/10 p-1.5 rounded-full flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="font-medium">{q.question}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="space-y-2">
                  {q.purpose && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Mục đích câu hỏi:</p>
                      <p className="text-sm text-muted-foreground">{q.purpose}</p>
                    </div>
                  )}
                  {q.suggestions && (
                    <div className="pt-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">Gợi ý câu trả lời:</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2" 
                          onClick={() => copyToClipboard(q.suggestions)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" /> Sao chép
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{q.suggestions}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))
      )}
    </div>
  );

  return (
    <>
        <Button
        variant="outline"
        className="rounded-md border-accent text-accent hover:bg-accent/10"
        onClick={() => {
            setOpen(true);
            // Thêm trực tiếp việc gọi API khi click button
            fetchInterviewQuestions();
        }}
        >
        <HelpCircle className="h-4 w-4 mr-2" />
        Câu hỏi phỏng vấn
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-accent" />
              Câu hỏi phỏng vấn cho {jobTitle}
            </DialogTitle>
            <DialogDescription>
              Chuẩn bị trước các câu hỏi phỏng vấn phổ biến cho vị trí này để tăng cơ hội trúng tuyển.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-muted-foreground">Đang tạo câu hỏi phỏng vấn...</p>
            </div>
          ) : questions ? (
            <div className="mt-2">
              <Tabs defaultValue="technical" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="technical" className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>Chuyên môn</span>
                    <Badge variant="outline" className="ml-1">{categories.technical.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="experience" className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Kinh nghiệm</span>
                    <Badge variant="outline" className="ml-1">{categories.experience.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="culture" className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    <span>Văn hóa</span>
                    <Badge variant="outline" className="ml-1">{categories.culture.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="technical">
                  <QuestionGroup questions={categories.technical} icon={<Briefcase className="h-4 w-4 text-accent" />} />
                </TabsContent>
                <TabsContent value="experience">
                  <QuestionGroup questions={categories.experience} icon={<Sparkles className="h-4 w-4 text-accent" />} />
                </TabsContent>
                <TabsContent value="culture">
                  <QuestionGroup questions={categories.culture} icon={<User className="h-4 w-4 text-accent" />} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="h-16 w-16 text-accent/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Không thể tải câu hỏi phỏng vấn. Vui lòng thử lại.
              </p>
                <Button 
    onClick={fetchInterviewQuestions} 
    variant="outline"
    className="mx-auto"
  >
    Thử lại
  </Button>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOpen(false)} variant="outline">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InterviewQuestionButton;