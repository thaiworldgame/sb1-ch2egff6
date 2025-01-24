import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Equal, GripHorizontal, X, PlusCircle, Minus, X as Multiply, Divide, ParenthesesIcon } from 'lucide-react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  IconButton, 
  Box,
  Grid,
  Tabs,
  Tab
} from '@mui/material';

interface Parameter {
  id: string;
  name: string;
  value: number;
}

interface IFormula {
  formula: string;
  value: string;
}

interface FormulaCanvas {
  id: string;
  name: string;
  formulas: IFormula[];
}

type Operation = '+' | '-' | '*' | '/';

function App() {
  const [parameters, setParameters] = useState<Parameter[]>([
    { id: 'p1', name: 'Parameter 1', value: 0 },
    { id: 'p2', name: 'Parameter 2', value: 0 },
    { id: 'p3', name: 'Parameter 3', value: 0 }
  ]);

  const [canvases, setCanvases] = useState<FormulaCanvas[]>([
    {
      id: 'canvas1',
      name: 'Formula 1',
      formulas: [
        { formula: '(', value: '(' },
        { formula: 'Parameter 1', value: 'p1' },
        { formula: 'plus', value: '+' },
        { formula: 'Parameter 2', value: 'p2' },
        { formula: ')', value: ')' }
      ]
    },
    {
      id: 'canvas2',
      name: 'Formula 2',
      formulas: [
        { formula: 'Parameter 3', value: 'p3' },
        { formula: 'multiply', value: '*' },
        { formula: 'Parameter 1', value: 'p1' }
      ]
    }
  ]);

  const [activeCanvas, setActiveCanvas] = useState(0);

  const calculateResult = (formulas: IFormula[]) => {
    const evaluateExpression = (expr: IFormula[]): number => {
      let result = 0;
      let currentOp: Operation = '+';
      let i = 0;
      
      while (i < expr.length) {
        const item = expr[i];
        
        if (item.value === '(') {
          let parenthesesCount = 1;
          let j = i + 1;
          const subExpr: IFormula[] = [];
          
          while (j < expr.length && parenthesesCount > 0) {
            if (expr[j].value === '(') parenthesesCount++;
            if (expr[j].value === ')') parenthesesCount--;
            if (parenthesesCount > 0) subExpr.push(expr[j]);
            j++;
          }
          
          const subResult = evaluateExpression(subExpr);
          
          if (i === 0) {
            result = subResult;
          } else {
            switch (currentOp) {
              case '+': result += subResult; break;
              case '-': result -= subResult; break;
              case '*': result *= subResult; break;
              case '/': result = subResult !== 0 ? result / subResult : result; break;
            }
          }
          
          i = j;
        } else if (['+', '-', '*', '/'].includes(item.value)) {
          currentOp = item.value as Operation;
          i++;
        } else {
          const value = parameters.find(p => p.id === item.value)?.value || 0;
          if (i === 0) {
            result = value;
          } else {
            switch (currentOp) {
              case '+': result += value; break;
              case '-': result -= value; break;
              case '*': result *= value; break;
              case '/': result = value !== 0 ? result / value : result; break;
            }
          }
          i++;
        }
      }
      
      return result;
    };
    
    return evaluateExpression(formulas);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    
    const sourceCanvas = canvases.find(c => c.id === sourceId);
    const destCanvas = canvases.find(c => c.id === destId);
    
    if (!sourceCanvas || !destCanvas) return;
    
    const newCanvases = canvases.map(canvas => {
      if (canvas.id === sourceId) {
        const newFormulas = [...canvas.formulas];
        const [removed] = newFormulas.splice(result.source.index, 1);
        
        if (canvas.id === destId) {
          newFormulas.splice(result.destination.index, 0, removed);
        }
        
        return { ...canvas, formulas: newFormulas };
      }
      
      if (canvas.id === destId && sourceId !== destId) {
        const newFormulas = [...canvas.formulas];
        const [removed] = sourceCanvas.formulas.splice(result.source.index, 1);
        newFormulas.splice(result.destination.index, 0, removed);
        return { ...canvas, formulas: newFormulas };
      }
      
      return canvas;
    });
    
    setCanvases(newCanvases);
  };

  const handleParameterChange = (id: string, value: number) => {
    setParameters(parameters.map(p => 
      p.id === id ? { ...p, value } : p
    ));
  };

  const addParameter = () => {
    const newId = `p${parameters.length + 1}`;
    const newName = `Parameter ${parameters.length + 1}`;
    setParameters([...parameters, { 
      id: newId, 
      name: newName, 
      value: 0 
    }]);
  };

  const removeParameter = (id: string) => {
    setParameters(parameters.filter(p => p.id !== id));
    setCanvases(canvases.map(canvas => ({
      ...canvas,
      formulas: canvas.formulas.filter(item => item.value !== id)
    })));
  };

  const addToFormula = (param: Parameter, operation: Operation = '+') => {
    const currentCanvas = canvases[activeCanvas];
    if (!currentCanvas) return;

    const newFormulas = currentCanvas.formulas.length === 0 
      ? [{ formula: param.name, value: param.id }]
      : [...currentCanvas.formulas,
          { formula: operation === '+' ? 'plus' : operation === '-' ? 'minus' : operation === '*' ? 'multiply' : 'divide', value: operation },
          { formula: param.name, value: param.id }
        ];

    setCanvases(canvases.map((canvas, index) => 
      index === activeCanvas ? { ...canvas, formulas: newFormulas } : canvas
    ));
  };

  const addParentheses = () => {
    const currentCanvas = canvases[activeCanvas];
    if (!currentCanvas) return;

    setCanvases(canvases.map((canvas, index) => 
      index === activeCanvas ? {
        ...canvas,
        formulas: [...canvas.formulas,
          { formula: '(', value: '(' },
          { formula: ')', value: ')' }
        ]
      } : canvas
    ));
  };

  const addNewCanvas = () => {
    const newId = `canvas${canvases.length + 1}`;
    const newCanvas = {
      id: newId,
      name: `Formula ${canvases.length + 1}`,
      formulas: []
    };
    setCanvases([...canvases, newCanvas]);
    setActiveCanvas(canvases.length);
  };

  const removeCanvas = (indexToRemove: number) => {
    if (canvases.length <= 1) {
      return;
    }
    
    const newCanvases = canvases.filter((_, index) => index !== indexToRemove);
    setCanvases(newCanvases);
    
    if (activeCanvas >= indexToRemove) {
      setActiveCanvas(Math.max(0, activeCanvas - 1));
    }
  };

  const renameCanvas = (index: number, newName: string) => {
    const newCanvases = canvases.map((canvas, i) => 
      i === index ? { ...canvas, name: newName } : canvas
    );
    setCanvases(newCanvases);
  };

  const removeFromFormula = (index: number) => {
    const currentCanvas = canvases[activeCanvas];
    if (!currentCanvas) return;

    const newFormulas = [...currentCanvas.formulas];
    if (['+', '-', '*', '/'].includes(currentCanvas.formulas[index].value)) {
      newFormulas.splice(index - 1, 2);
    } else if (index > 0) {
      newFormulas.splice(index - 1, 2);
    } else if (index === 0 && currentCanvas.formulas.length > 1) {
      newFormulas.splice(0, 2);
    } else {
      newFormulas.splice(index, 1);
    }

    setCanvases(canvases.map((canvas, i) => 
      i === activeCanvas ? { ...canvas, formulas: newFormulas } : canvas
    ));
  };

  const OperationButton = ({ onClick, operation, icon: Icon }: { onClick: () => void, operation: string, icon: React.ElementType }) => (
    <IconButton
      onClick={onClick}
      color="primary"
      size="small"
      title={`Add with ${operation}`}
    >
      <Icon />
    </IconButton>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 6 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Block Expression Calculator
        </Typography>

        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Parameters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<ParenthesesIcon />}
                  onClick={addParentheses}
                >
                  Add Parentheses
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<Plus />}
                  onClick={addNewCanvas}
                >
                  Add Formula Canvas
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlusCircle />}
                  onClick={addParameter}
                >
                  Add Parameter
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2}>
              {parameters.map((param) => (
                <Grid item xs={12} md={6} key={param.id}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ minWidth: 100 }}>{param.name}</Typography>
                    <TextField
                      type="number"
                      value={param.value}
                      onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                      size="small"
                      fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <OperationButton onClick={() => addToFormula(param, '+')} operation="add" icon={Plus} />
                      <OperationButton onClick={() => addToFormula(param, '-')} operation="subtract" icon={Minus} />
                      <OperationButton onClick={() => addToFormula(param, '*')} operation="multiply" icon={Multiply} />
                      <OperationButton onClick={() => addToFormula(param, '/')} operation="divide" icon={Divide} />
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeParameter(param.id)}
                      >
                        <X />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Formulas
            </Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
              <Tabs 
                value={activeCanvas}
                onChange={(_, newValue) => setActiveCanvas(newValue)}
                sx={{ flex: 1 }}
              >
                {canvases.map((canvas, index) => (
                  <Tab
                    key={canvas.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{canvas.name}</span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCanvas(index);
                          }}
                          sx={{
                            opacity: 0.5,
                            '&:hover': { opacity: 1 },
                            display: canvases.length > 1 ? 'inline-flex' : 'none'
                          }}
                        >
                          <X size={14} />
                        </IconButton>
                      </Box>
                    }
                    sx={{ 
                      minHeight: 48,
                      textTransform: 'none',
                      '&:hover .MuiIconButton-root': { opacity: 1 }
                    }}
                  />
                ))}
              </Tabs>
              <IconButton
                color="primary"
                onClick={addNewCanvas}
                sx={{ ml: 1 }}
                title="Add new formula"
              >
                <Plus />
              </IconButton>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
              {canvases.map((canvas, index) => (
                <Box key={canvas.id} sx={{ display: activeCanvas === index ? 'block' : 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                    <TextField
                      size="small"
                      value={canvas.name}
                      onChange={(e) => renameCanvas(index, e.target.value)}
                      sx={{ width: 200 }}
                      placeholder="Formula name"
                    />
                  </Box>
                  <Droppable droppableId={canvas.id} direction="horizontal">
                    {(provided) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        variant="outlined"
                        sx={{ 
                          p: 2, 
                          minHeight: 60,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 1,
                          alignItems: 'center'
                        }}
                      >
                        {canvas.formulas.map((item, itemIndex) => (
                          <Draggable key={`${canvas.id}-${itemIndex}`} draggableId={`${canvas.id}-${itemIndex}`} index={itemIndex}>
                            {(provided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {['+', '-', '*', '/'].includes(item.value) ? (
                                  <Paper sx={{ p: 1, bgcolor: 'primary.light' }}>
                                    {item.value === '+' && <Plus />}
                                    {item.value === '-' && <Minus />}
                                    {item.value === '*' && <Multiply />}
                                    {item.value === '/' && <Divide />}
                                  </Paper>
                                ) : item.value === '(' || item.value === ')' ? (
                                  <Paper sx={{ p: 1, bgcolor: 'grey.200' }}>
                                    <Typography variant="h6" component="span">
                                      {item.value}
                                    </Typography>
                                  </Paper>
                                ) : (
                                  <Paper 
                                    sx={{ 
                                      p: 1, 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1,
                                      '&:hover .remove-btn': { opacity: 1 }
                                    }}
                                  >
                                    <GripHorizontal size={16} />
                                    <Typography>{item.formula}</Typography>
                                    <IconButton
                                      className="remove-btn"
                                      size="small"
                                      color="error"
                                      onClick={() => removeFromFormula(itemIndex)}
                                      sx={{ opacity: 0, transition: 'opacity 0.2s' }}
                                    >
                                      <X size={16} />
                                    </IconButton>
                                  </Paper>
                                )}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Paper>
                    )}
                  </Droppable>

                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      mt: 2,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 2 
                    }}
                  >
                    <Equal />
                    <Typography variant="h4" component="span">
                      {calculateResult(canvas.formulas)}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </DragDropContext>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default App;