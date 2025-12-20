            <TabsContent value="workflow" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">End-to-End Workflow Test</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={runCompleteWorkflow} 
                    disabled={workflowSession?.isRunning}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {workflowSession?.isRunning ? 'Running...' : 'Start Workflow'}
                  </Button>
                  {workflowSession && (
                    <Button onClick={resetWorkflow} variant="outline" size="sm">
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {!workflowSession ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-gray-500 space-y-4">
                      <p className="text-lg font-medium">Complete User Journey Test</p>
                      <p className="text-sm">
                        This workflow tests the entire BeatBazaar experience from admin setup to user purchase and playback.
                      </p>
                      <Button onClick={createWorkflowSession} className="mt-4">
                        Initialize Workflow Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Progress Overview */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                          <p className="text-2xl font-bold">
                            {workflowSession.steps.filter(s => s.status === 'completed').length} / {workflowSession.steps.length}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                          <Badge variant={workflowSession.isRunning ? "default" : "secondary"}>
                            {workflowSession.isRunning ? 'Running' : 'Ready'}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(workflowSession.steps.filter(s => s.status === 'completed').length / workflowSession.steps.length) * 100}%` 
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Flowchart matching white diagram exactly */}
                  <div className="relative bg-white dark:bg-gray-800 rounded-lg border p-6 min-h-[450px] w-full">
                    <h4 className="text-lg font-semibold mb-8 text-center">BeatBazaar Complete User Journey</h4>
                    
                    <div className="relative w-full h-96">
                      {/* START block */}
                      <div className="absolute w-28 h-12 border border-gray-400 bg-white dark:bg-gray-700 flex items-center justify-center text-sm font-medium"
                           style={{ left: '20px', top: '60px' }}>
                        Start
                      </div>

                      {/* Top row blocks */}
                      {[
                        { step: workflowSession.steps[0], x: 180, y: 60, name: 'Admin Login' },
                        { step: workflowSession.steps[1], x: 340, y: 60, name: 'Create Genre' },
                        { step: workflowSession.steps[2], x: 500, y: 60, name: 'Upload Beat' },
                        { step: workflowSession.steps[3], x: 660, y: 60, name: 'Create User' }
                      ].map((block, index) => (
                        <div
                          key={`top-${index}`}
                          className={`absolute w-28 h-12 border flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                            block.step?.status === 'running' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse' :
                            block.step?.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                            block.step?.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                            'border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                          style={{ left: `${block.x}px`, top: `${block.y}px` }}
                        >
                          {block.name}
                        </div>
                      ))}

                      {/* Bottom row blocks */}
                      {[
                        { step: workflowSession.steps[7], x: 180, y: 180, name: 'Purchase Beat' },
                        { step: workflowSession.steps[6], x: 340, y: 180, name: 'Add to Cart' },
                        { step: workflowSession.steps[5], x: 500, y: 180, name: 'Browse Beats' },
                        { step: workflowSession.steps[4], x: 660, y: 180, name: 'User Login' }
                      ].map((block, index) => (
                        <div
                          key={`bottom-${index}`}
                          className={`absolute w-28 h-12 border flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                            block.step?.status === 'running' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse' :
                            block.step?.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                            block.step?.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                            'border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                          style={{ left: `${block.x}px`, top: `${block.y}px` }}
                        >
                          {block.name}
                        </div>
                      ))}

                      {/* Final row blocks */}
                      {[
                        { step: workflowSession.steps[8], x: 180, y: 300, name: 'View Library' },
                        { step: workflowSession.steps[9], x: 340, y: 300, name: 'Play Full Song' },
                        { step: workflowSession.steps[10], x: 500, y: 300, name: 'Download Song' }
                      ].map((block, index) => (
                        <div
                          key={`final-${index}`}
                          className={`absolute w-28 h-12 border flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                            block.step?.status === 'running' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse' :
                            block.step?.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                            block.step?.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                            'border-gray-400 bg-white dark:bg-gray-700'
                          }`}
                          style={{ left: `${block.x}px`, top: `${block.y}px` }}
                        >
                          {block.name}
                        </div>
                      ))}

                      {/* FINISH block */}
                      <div className="absolute w-28 h-12 border border-gray-400 bg-white dark:bg-gray-700 flex items-center justify-center text-sm font-medium"
                           style={{ left: '660px', top: '300px' }}>
                        Finish
                      </div>

                      {/* SVG arrows matching exact flow pattern */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                          <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#374151" />
                          </marker>
                          <marker id="arrow-completed" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
                          </marker>
                          <marker id="arrow-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
                          </marker>
                        </defs>
                        
                        {/* Top row arrows (left to right) */}
                        <line x1="48" y1="66" x2="180" y2="66" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="208" y1="66" x2="340" y2="66" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="368" y1="66" x2="500" y2="66" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="528" y1="66" x2="660" y2="66" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        
                        {/* Vertical arrow: Create User → User Login */}
                        <line x1="674" y1="72" x2="674" y2="180" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />

                        {/* Bottom row arrows (right to left) */}
                        <line x1="660" y1="186" x2="528" y2="186" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="500" y1="186" x2="368" y2="186" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="340" y1="186" x2="208" y2="186" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />

                        {/* Vertical arrow: Purchase Beat → View Library */}
                        <line x1="194" y1="192" x2="194" y2="300" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />

                        {/* Final row arrows (left to right) */}
                        <line x1="208" y1="306" x2="340" y2="306" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="368" y1="306" x2="500" y2="306" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                        <line x1="528" y1="306" x2="660" y2="306" stroke="#374151" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      </svg>
                    </div>

                    {/* Status legend */}
                    <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border rounded p-3 text-xs">
                      <div className="font-semibold mb-2">Status Legend</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded animate-pulse"></div>
                          <span>Running</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>Failed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-400 rounded"></div>
                          <span>Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  {!workflowSession.isRunning && workflowSession.steps.some(s => s.status !== 'pending') && (
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-4">Workflow Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {workflowSession.steps.filter(s => s.status === 'completed').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-600">
                              {workflowSession.steps.filter(s => s.status === 'failed').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-600">
                              {workflowSession.steps.filter(s => s.status === 'pending').length}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                          </div>
                        </div>
                        
                        {/* Auto-cleanup notification */}
                        {workflowSession.steps.filter(s => s.status === 'completed').length === workflowSession.steps.length && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium">Workflow Complete</span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              Demo data will be automatically cleaned up in a few seconds.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>